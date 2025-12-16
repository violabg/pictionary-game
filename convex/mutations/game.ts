import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { canGuess, requireAuth } from "../lib/permissions";

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
  },
  returns: v.object({
    is_correct: v.boolean(),
    is_fuzzy_match: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = requireAuth(ctx);

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

    // Get the card
    const card = await ctx.db.get(turn.card_id);
    if (!card) throw new Error("Card not found");

    // Check if guess is correct (exact match)
    const isCorrect =
      args.guess_text.toLowerCase().trim() === card.word.toLowerCase().trim();

    // TODO: Add fuzzy matching with Groq AI
    const isFuzzyMatch = false;

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

    // If correct, update player score
    if (isCorrect || isFuzzyMatch) {
      const player = await ctx.db
        .query("players")
        .withIndex("by_game_and_player", (q) =>
          q.eq("game_id", args.game_id).eq("player_id", userId)
        )
        .first();

      if (player) {
        await ctx.db.patch(player._id, {
          score: player.score + 10,
          correct_guesses: player.correct_guesses + 1,
        });
      }

      // Update turn with correct guess count
      await ctx.db.patch(args.turn_id, {
        correct_guesses: turn.correct_guesses + 1,
      });
    }

    return {
      is_correct: isCorrect,
      is_fuzzy_match: isFuzzyMatch,
      message: isCorrect ? "Correct!" : "Not quite...",
    };
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = requireAuth(ctx);

    // Verify user is host
    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");
    if (game.created_by !== userId)
      throw new Error("Only host can complete turn");

    const turn = await ctx.db.get(args.turn_id);
    if (!turn) throw new Error("Turn not found");

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
    const userId = requireAuth(ctx);

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

    if (!nextCard) throw new Error("No cards available");

    // Create turn
    const turnId = await ctx.db.insert("turns", {
      game_id: args.game_id,
      round: game.round,
      drawer_id: userId,
      card_id: nextCard._id,
      status: "drawing",
      time_limit: 60, // 60 seconds
      started_at: Date.now(),
      correct_guesses: 0,
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
