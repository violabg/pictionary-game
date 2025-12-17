import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  mutation,
} from "../_generated/server";
import { isGameHost, requireAuth } from "../lib/permissions";

/**
 * Create a new game with randomly generated code
 */
export const createGame = mutation({
  args: {
    category: v.string(),
    max_rounds: v.optional(v.number()),
  },
  returns: v.object({
    game_id: v.id("games"),
    code: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log("🚀 ~ userId:", userId);
    if (!userId) throw new Error("Unauthorized");

    // Generate random 4-character code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Check if code already exists (very unlikely but good practice)
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    console.log("🚀 ~ existingGame:", existingGame);

    if (existingGame) {
      throw new Error("Code collision, please try again");
    }

    // Get user profile for username
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Create game
    const gameId = await ctx.db.insert("games", {
      code,
      status: "waiting",
      category: args.category,
      created_by: userId,
      round: 0,
      max_rounds: args.max_rounds || 5,
      created_at: Date.now(),
    });

    // Add creator as first player (host)
    await ctx.db.insert("players", {
      game_id: gameId,
      player_id: userId,
      username: profile.username,
      avatar_url: profile.avatar_url,
      score: 0,
      correct_guesses: 0,
      is_host: true,
      joined_at: Date.now(),
    });

    // Generate cards asynchronously
    ctx.scheduler.runAfter(0, internal.mutations.games.generateAndStoreCards, {
      gameId,
      category: args.category,
      count: 8,
    });

    return { game_id: gameId, code };
  },
});

/**
 * Join an existing game by code
 */
export const joinGame = mutation({
  args: {
    code: v.string(),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Find game by code
    const game = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "waiting") {
      throw new Error("Game has already started or finished");
    }

    // Check if already in game
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game_and_player", (q) =>
        q.eq("game_id", game._id).eq("player_id", userId)
      )
      .first();

    if (existingPlayer) {
      return game._id;
    }

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Add player to game
    await ctx.db.insert("players", {
      game_id: game._id,
      player_id: userId,
      username: profile.username,
      avatar_url: profile.avatar_url,
      score: 0,
      correct_guesses: 0,
      is_host: false,
      joined_at: Date.now(),
    });

    return game._id;
  },
});

/**
 * Start the game (only host can do this)
 */
export const startGame = mutation({
  args: {
    game_id: v.id("games"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const game = await ctx.db.get(args.game_id);
    if (!game) throw new Error("Game not found");

    const isHost = await isGameHost(ctx, args.game_id, userId);
    if (!isHost) throw new Error("Only host can start the game");

    if (game.status !== "waiting") {
      throw new Error("Game is not in waiting status");
    }

    // Get all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    if (players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    // Start game and set first drawer
    const firstDrawerIndex = Math.floor(Math.random() * players.length);
    const firstDrawer = players[firstDrawerIndex];

    await ctx.db.patch(args.game_id, {
      status: "started",
      current_drawer_id: firstDrawer.player_id,
      started_at: Date.now(),
    });

    return null;
  },
});

/**
 * Leave a game
 */
export const leaveGame = mutation({
  args: {
    game_id: v.id("games"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Find and delete player record
    const player = await ctx.db
      .query("players")
      .withIndex("by_game_and_player", (q) =>
        q.eq("game_id", args.game_id).eq("player_id", userId)
      )
      .first();

    if (!player) {
      throw new Error("Player not in game");
    }

    // If host, delete the game
    const game = await ctx.db.get(args.game_id);
    if (game && game.created_by === userId) {
      // Delete all associated records
      const players = await ctx.db
        .query("players")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      for (const p of players) {
        await ctx.db.delete(p._id);
      }

      const cards = await ctx.db
        .query("cards")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      for (const card of cards) {
        await ctx.db.delete(card._id);
      }

      const turns = await ctx.db
        .query("turns")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      for (const turn of turns) {
        await ctx.db.delete(turn._id);
      }

      const guesses = await ctx.db
        .query("guesses")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      for (const guess of guesses) {
        await ctx.db.delete(guess._id);
      }

      const drawings = await ctx.db
        .query("drawings")
        .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
        .collect();

      for (const drawing of drawings) {
        await ctx.db.delete(drawing._id);
      }

      await ctx.db.delete(args.game_id);
    } else {
      // Just remove player
      await ctx.db.delete(player._id);
    }

    return null;
  },
});

/**
 * Internal mutation to generate and store cards
 */
export const generateAndStoreCards = internalAction({
  args: {
    gameId: v.id("games"),
    category: v.string(),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Generate cards via the public action in Node runtime
    const cards = await ctx.runAction(api.actions.generateCards.generateCards, {
      category: args.category,
      count: args.count,
    });

    // Store cards via an internal mutation (actions can't use ctx.db)
    await ctx.runMutation(internal.mutations.games.storeCards, {
      gameId: args.gameId,
      category: args.category,
      cards,
    });

    return null;
  },
});

/**
 * Internal mutation to persist generated cards
 */
export const storeCards = internalMutation({
  args: {
    gameId: v.id("games"),
    category: v.string(),
    cards: v.array(
      v.object({
        word: v.string(),
        description: v.string(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const card of args.cards) {
      await ctx.db.insert("cards", {
        game_id: args.gameId,
        word: card.word,
        description: card.description,
        category: args.category,
        is_used: false,
        created_at: Date.now(),
      });
    }
    return null;
  },
});
