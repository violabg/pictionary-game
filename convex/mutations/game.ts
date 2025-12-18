import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { canGuess } from "../lib/permissions";

/**
 * Submit a guess and complete the turn
 * This is an atomic operation that:
 * - Records the guess
 * - Checks if it's correct
 * - Updates player scores
 * - Rotates to next drawer if round is complete
 */
export const submitGuessAndCompleteTurn = mutation({
  args: {
    game_id: v.id("games"),
    turn_id: v.id("turns"),
    guess_text: v.string(),
    isValidated: v.optional(v.boolean()), // Client-side validation result (for fuzzy matches)
  },
  returns: v.object({
    is_correct: v.boolean(),
    is_fuzzy_match: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user can guess
    const canGuessResult = await canGuess(ctx, args.game_id, userId);
    if (!canGuessResult) {
      throw new Error("You cannot guess (you are the drawer)");
    }

    // Get game and turn
    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");

    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

    // Validate turn status - prevent race conditions
    if (turn.status !== "drawing") {
      return {
        is_correct: false,
        is_fuzzy_match: false,
        message: "Turn already completed",
      };
    }

    // Server-side timer validation: reject if time limit exceeded
    const now = Date.now();
    if (turn.started_at) {
      const elapsedSec = Math.floor((now - turn.started_at) / 1000);
      if (elapsedSec >= turn.time_limit) {
        return {
          is_correct: false,
          is_fuzzy_match: false,
          message: "Time is up! No more guesses accepted.",
        };
      }
    }

    // Mark turn as completing to prevent concurrent completions
    await ctx.db.patch(args.turn_id, {
      status: "completing",
    });

    // Get the card
    const card = await ctx.db.get(turn.card_id);
    if (!card) throw new Error("Card not found");

    // Check if guess is correct (exact match)
    const isCorrect =
      args.guess_text.toLowerCase().trim() === card.word.toLowerCase().trim();

    // Accept client-side validation result for fuzzy matches
    const isFuzzyMatch = (args.isValidated ?? false) && !isCorrect;

    // Record the guess
    await ctx.db.insert("guesses", {
      game_id: args.game_id,
      turn_id: args.turn_id,
      player_id: userId,
      guess_text: args.guess_text,
      is_correct: isCorrect,
      is_fuzzy_match: isFuzzyMatch,
      submitted_at: Date.now(),
    });

    // If correct, mark turn as completing and award points
    // Drawer will upload drawing and finalize turn completion
    if (isCorrect || isFuzzyMatch) {
      const player = await ctx.db
        .query("players")
        .withIndex("by_game_and_player", (q) =>
          q.eq("game_id", args.game_id).eq("player_id", userId)
        )
        .first();

      const now = Date.now();
      const elapsedSec = turn.started_at
        ? Math.floor((now - turn.started_at!) / 1000)
        : 0;
      const timeLeft = Math.max(0, turn.time_limit - elapsedSec);
      const guesserPoints = Math.max(0, timeLeft);

      // Award points to guesser
      if (player) {
        await ctx.db.patch(player._id, {
          score: player.score + guesserPoints,
          correct_guesses: player.correct_guesses + 1,
        });
      }

      // Award points to drawer (25% of time remaining + minimum 10 points)
      const drawerPoints = Math.max(10, Math.floor(timeLeft / 4));
      const drawerPlayer = await ctx.db
        .query("players")
        .withIndex("by_game_and_player", (q) =>
          q.eq("game_id", args.game_id).eq("player_id", turn.drawer_id)
        )
        .first();

      if (drawerPlayer) {
        await ctx.db.patch(drawerPlayer._id, {
          score: drawerPlayer.score + drawerPoints,
        });
      }

      // Mark turn as completing - drawer will finalize after uploading drawing
      // This prevents other guesses from triggering turn completion
      await ctx.db.patch(args.turn_id, {
        status: "completing",
        correct_guesses: turn.correct_guesses + 1,
        winner_id: userId,
        points_awarded: guesserPoints,
        drawer_points_awarded: drawerPoints,
        completed_at: now,
      });

      return {
        is_correct: true,
        is_fuzzy_match: isFuzzyMatch,
        message: "Correct!",
      };
    }

    // If guess was not correct, revert turn status back to drawing
    await ctx.db.patch(args.turn_id, {
      status: "drawing",
    });

    return {
      is_correct: false,
      is_fuzzy_match: isFuzzyMatch,
      message: "Not quite...",
    };
  },
});

/**
 * Finalize turn completion after drawing upload
 * Called by drawer after capturing and uploading drawing
 * This advances to next turn/round
 */
export const finalizeTurnCompletion = mutation({
  args: {
    game_id: v.id("games"),
    turn_id: v.id("turns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");

    // Only drawer can finalize (they uploaded the drawing)
    if (turn.drawer_id !== userId) {
      throw new Error("Only drawer can finalize turn");
    }

    // Validate turn is in completing state
    if (turn.status !== "completing") {
      throw new Error("Turn is not in completing state");
    }

    // Mark turn as completed
    await ctx.db.patch(args.turn_id, {
      status: "completed",
    });

    // Advance to next drawer/round
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    const playersInRound = await ctx.db
      .query("turns")
      .withIndex("by_game_and_round", (q) =>
        q.eq("game_id", args.game_id).eq("round", turn.round)
      )
      .collect();

    if (playersInRound.length >= allPlayers.length) {
      // Round complete, advance to next round or finish game
      const nextRound = turn.round + 1;

      if (nextRound >= game.max_rounds) {
        // Game finished
        await ctx.db.patch(args.game_id, {
          status: "finished",
          finished_at: Date.now(),
        });
      } else {
        // Advance round - set new drawer (rotate)
        const currentDrawerIndex = allPlayers.findIndex(
          (p) => p.player_id === turn.drawer_id
        );
        const nextDrawerIndex = (currentDrawerIndex + 1) % allPlayers.length;

        await ctx.db.patch(args.game_id, {
          round: nextRound,
          current_drawer_id: allPlayers[nextDrawerIndex].player_id,
        });
      }
    } else {
      // Same round: set next drawer to a player who hasn't drawn yet
      const drawnSet = new Set(playersInRound.map((t) => t.drawer_id));
      const startIdx = allPlayers.findIndex(
        (p) => p.player_id === turn.drawer_id
      );
      for (let offset = 1; offset < allPlayers.length; offset++) {
        const idx = (startIdx + offset) % allPlayers.length;
        const candidate = allPlayers[idx];
        if (!drawnSet.has(candidate.player_id)) {
          await ctx.db.patch(args.game_id, {
            current_drawer_id: candidate.player_id,
          });
          break;
        }
      }
    }

    return null;
  },
});

/**
 * Complete a turn manually (host selects winner or time is up)
 */
export const completeGameTurn = mutation({
  args: {
    game_id: v.id("games"),
    turn_id: v.id("turns"),
    reason: v.union(v.literal("time_up"), v.literal("manual")),
    winner_id: v.optional(v.string()),
    points_awarded: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user is host
    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");
    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

    // Validate turn status - prevent race conditions
    if (turn.status !== "drawing") {
      throw new Error("Turn already completed or completing");
    }

    // Server-side timer validation: allow small tolerance for network latency
    const nowTime = Date.now();
    if (turn.started_at && args.reason === "time_up") {
      const elapsedSec = Math.floor((nowTime - turn.started_at) / 1000);
      // Allow 2 second tolerance for network/client-server time skew
      const toleranceSec = 2;
      if (elapsedSec < turn.time_limit - toleranceSec) {
        throw new Error(
          `Cannot complete turn: ${
            turn.time_limit - elapsedSec
          } seconds remaining`
        );
      }
    }

    // Allow either host or current drawer to complete the turn
    const isHost = game.created_by === userId;
    const isDrawer = turn.drawer_id === userId;
    if (!isHost && !isDrawer)
      throw new Error("Only host or drawer can complete turn");

    // Mark turn as completing to prevent concurrent completions
    await ctx.db.patch(args.turn_id, {
      status: "completing",
    });

    // Calculate time remaining for scoring
    const nowTimestamp = Date.now();
    const elapsedSec = turn.started_at
      ? Math.floor((nowTimestamp - turn.started_at!) / 1000)
      : 0;
    const timeLeft = Math.max(0, turn.time_limit - elapsedSec);

    // If a manual winner is provided, award points by inserting a correct guess
    if (args.reason === "manual" && args.winner_id) {
      const winnerPlayer = await ctx.db
        .query("players")
        .withIndex("by_game_and_player", (q) =>
          q.eq("game_id", args.game_id).eq("player_id", args.winner_id!)
        )
        .first();
      if (winnerPlayer) {
        const guesserPoints = args.points_awarded ?? Math.max(0, timeLeft);
        const drawerPoints = Math.max(10, Math.floor(timeLeft / 4));

        // Create a synthetic correct guess for history consistency
        await ctx.db.insert("guesses", {
          game_id: args.game_id,
          turn_id: args.turn_id,
          player_id: args.winner_id!,
          guess_text: "[manual]",
          is_correct: true,
          is_fuzzy_match: false,
          submitted_at: Date.now(),
        });

        // Award points to winner
        await ctx.db.patch(winnerPlayer._id, {
          score: winnerPlayer.score + guesserPoints,
          correct_guesses: winnerPlayer.correct_guesses + 1,
        });

        // Award points to drawer
        const drawerPlayer = await ctx.db
          .query("players")
          .withIndex("by_game_and_player", (q) =>
            q.eq("game_id", args.game_id).eq("player_id", turn.drawer_id)
          )
          .first();

        if (drawerPlayer) {
          await ctx.db.patch(drawerPlayer._id, {
            score: drawerPlayer.score + drawerPoints,
          });
        }

        // Track count of correct guesses on the turn and scoring info
        await ctx.db.patch(args.turn_id, {
          correct_guesses: turn.correct_guesses + 1,
          winner_id: args.winner_id,
          points_awarded: guesserPoints,
          drawer_points_awarded: drawerPoints,
        });
      }
    }

    // Note: Drawing storage is now handled by uploadDrawing action
    // which atomically saves the storage ID via internal mutation

    // Mark turn as completed
    await ctx.db.patch(args.turn_id, {
      status: args.reason === "time_up" ? "time_up" : "completed",
      completed_at: Date.now(),
    });

    // Check if all players have drawn in this round
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    const playersInRound = await ctx.db
      .query("turns")
      .withIndex("by_game_and_round", (q) =>
        q.eq("game_id", args.game_id).eq("round", turn.round)
      )
      .collect();

    if (playersInRound.length >= allPlayers.length) {
      // Round complete, advance to next round or finish game
      const nextRound = turn.round + 1;

      if (nextRound >= game.max_rounds) {
        // Game finished
        await ctx.db.patch(args.game_id, {
          status: "finished",
          finished_at: Date.now(),
        });
      } else {
        // Advance round - set new drawer (rotate)
        const currentDrawerIndex = allPlayers.findIndex(
          (p) => p.player_id === turn.drawer_id
        );
        const nextDrawerIndex = (currentDrawerIndex + 1) % allPlayers.length;

        await ctx.db.patch(args.game_id, {
          round: nextRound,
          current_drawer_id: allPlayers[nextDrawerIndex].player_id,
        });
      }
    } else {
      // Same round: set next drawer to a player who hasn't drawn yet
      const drawnSet = new Set(playersInRound.map((t) => t.drawer_id));
      // Iterate from current drawer forward to find the next not drawn
      const startIdx = allPlayers.findIndex(
        (p) => p.player_id === turn.drawer_id
      );
      for (let offset = 1; offset < allPlayers.length; offset++) {
        const idx = (startIdx + offset) % allPlayers.length;
        const candidate = allPlayers[idx];
        if (!drawnSet.has(candidate.player_id)) {
          await ctx.db.patch(args.game_id, {
            current_drawer_id: candidate.player_id,
          });
          break;
        }
      }
    }

    return null;
  },
});

/**
 * Start a new turn for the current drawer
 */
export const startNewTurn = mutation({
  args: {
    game_id: v.id("games"),
  },
  returns: v.id("turns"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");

    const isDrawer = game.current_drawer_id === userId;
    if (!isDrawer) throw new Error("Only current drawer can start turn");

    // Get next unused card
    const nextCard = await ctx.db
      .query("cards")
      .withIndex("by_game_and_unused", (q) =>
        q.eq("game_id", args.game_id).eq("is_used", false)
      )
      .first();

    if (!nextCard) {
      // Check if any cards exist at all for this game
      const totalCards = await ctx.db
        .query("cards")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      if (totalCards.length === 0) {
        throw new Error(
          "Le carte stanno ancora caricando. Attendi qualche secondo e riprova."
        );
      } else {
        throw new Error(
          "Tutte le carte sono state utilizzate. Il gioco è terminato."
        );
      }
    }

    // Create turn (without started_at - will be set on first stroke)
    const turnId = await ctx.db.insert("turns", {
      game_id: args.game_id,
      round: game.round,
      drawer_id: userId,
      card_id: nextCard._id,
      status: "drawing",
      time_limit: 60, // 60 seconds
      // started_at is NOT set here - will be set when first stroke is drawn
      correct_guesses: 0,
    });

    // Phase 3: Create drawing record with empty canvas data
    // drawing_file_id will be set later when drawing is uploaded
    await ctx.db.insert("drawings", {
      game_id: args.game_id,
      card_id: nextCard._id,
      drawer_id: userId,
      turn_id: turnId,
      canvas_data: {
        strokes: [],
        width: 800,
        height: 600,
      },
      // drawing_file_id is optional, will be set after upload
      created_at: Date.now(),
    });

    // Mark card as used
    await ctx.db.patch(nextCard._id, {
      is_used: true,
    });

    // Update game with current card
    await ctx.db.patch(args.game_id, {
      current_card_id: nextCard._id,
    });

    return turnId;
  },
});
/**
 * Set the timer start time when the first stroke is drawn (draw-to-start timer)
 * This ensures the timer only starts when drawing actually begins, not when turn is created
 */
export const setTurnStartTime = mutation({
  args: {
    game_id: v.id("games"),
    turn_id: v.id("turns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

    // Only drawer can set turn start time
    if (turn.drawer_id !== userId) {
      throw new Error("Only drawer can set turn start time");
    }

    // Only set if not already set (idempotent - safe to call multiple times)
    if (!turn.started_at) {
      await ctx.db.patch(args.turn_id, {
        started_at: Date.now(),
      });
    }

    return null;
  },
});
