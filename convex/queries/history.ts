import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get game history for current user (finished games only)
 */
export const getUserGameHistory = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("games"),
        code: v.string(),
        category: v.string(),
        status: v.union(
          v.literal("waiting"),
          v.literal("started"),
          v.literal("finished")
        ),
        created_at: v.number(),
        round: v.number(),
        max_rounds: v.number(),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("🚀 ~ identity:", identity);
    if (!identity) {
      return {
        page: [],
        isDone: true,
        continueCursor: null,
      };
    }

    // Query games by created_by and status
    let query = ctx.db
      .query("games")
      .withIndex("by_created_by_and_status", (q) =>
        q.eq("created_by", identity.subject).eq("status", "finished")
      );
    console.log("🚀 ~ query:", query);

    // Add category filter if provided
    if (args.category && args.category !== "all") {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    const { page, isDone, continueCursor } = await query
      .order("desc")
      .paginate(args.paginationOpts);

    // Return only the validated fields to satisfy the returns validator
    return { page, isDone, continueCursor };
  },
});

/**
 * Get available categories for finished games where user participated
 */
export const getUserGameCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const games = await ctx.db
      .query("games")
      .withIndex("by_created_by_and_status", (q) =>
        q.eq("created_by", identity.subject).eq("status", "finished")
      )
      .collect();

    // Get unique categories
    const categories = [...new Set(games.map((g) => g.category))];
    return categories.sort();
  },
});

/**
 * Get detailed game history for a specific game (for viewing results)
 */
export const getGameHistoryDetails = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("games"),
      code: v.string(),
      category: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("started"),
        v.literal("finished")
      ),
      created_at: v.number(),
      round: v.number(),
      max_rounds: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.game_id);
    if (!game) return null;
    if (game.status !== "finished") return null; // Only return finished games

    return {
      _id: game._id,
      code: game.code,
      category: game.category,
      status: game.status,
      created_at: game.created_at,
      round: game.round,
      max_rounds: game.max_rounds,
    };
  },
});

/**
 * Get all turns for a finished game with related data
 */
export const getGameTurnsWithDetails = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("turns"),
      game_id: v.id("games"),
      round: v.number(),
      drawer_id: v.string(),
      drawer_username: v.string(),
      drawer_avatar_url: v.optional(v.string()),
      card_id: v.id("cards"),
      card_word: v.string(),
      card_description: v.string(),
      status: v.union(
        v.literal("drawing"),
        v.literal("completed"),
        v.literal("time_up")
      ),
      started_at: v.number(),
      completed_at: v.optional(v.number()),
      correct_guesses: v.number(),
      guesses_count: v.number(),
      winner_id: v.optional(v.string()),
      winner_username: v.optional(v.string()),
      winner_avatar_url: v.optional(v.string()),
      drawer_points_awarded: v.number(),
      points_awarded: v.number(),
      drawing_file_id: v.optional(v.id("_storage")),
    })
  ),
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    const result = [];
    for (const turn of turns) {
      // Get drawer info from players table
      const drawerPlayer = await ctx.db
        .query("players")
        .withIndex("by_game_and_player", (q) =>
          q.eq("game_id", args.game_id).eq("player_id", turn.drawer_id)
        )
        .first();

      // Get card info
      const card = await ctx.db.get(turn.card_id);

      // Get all guesses for this turn
      const guesses = await ctx.db
        .query("guesses")
        .withIndex("by_turn_id", (q) => q.eq("turn_id", turn._id))
        .collect();

      // Find winner (first correct guess)
      const correctGuess = guesses.find((g) => g.is_correct);
      let winnerPlayer = null;
      if (correctGuess) {
        winnerPlayer = await ctx.db
          .query("players")
          .withIndex("by_game_and_player", (q) =>
            q
              .eq("game_id", args.game_id)
              .eq("player_id", correctGuess.player_id)
          )
          .first();
      }

      // Get drawing if exists
      const drawing = await ctx.db
        .query("drawings")
        .withIndex("by_turn_id", (q) => q.eq("turn_id", turn._id))
        .first();

      result.push({
        _id: turn._id,
        game_id: turn.game_id,
        round: turn.round,
        drawer_id: turn.drawer_id,
        drawer_username: drawerPlayer?.username ?? "Unknown",
        drawer_avatar_url: drawerPlayer?.avatar_url,
        card_id: turn.card_id,
        card_word: card?.word ?? "Unknown",
        card_description: card?.description ?? "",
        status: turn.status,
        started_at: turn.started_at,
        completed_at: turn.completed_at,
        correct_guesses: turn.correct_guesses,
        guesses_count: guesses.length,
        winner_id: correctGuess ? correctGuess.player_id : undefined,
        winner_username: winnerPlayer?.username,
        winner_avatar_url: winnerPlayer?.avatar_url,
        drawer_points_awarded: drawerPlayer?.score ?? 0, // This should be calculated, but we'll store in player
        points_awarded: 1, // Default points per correct guess (can be customized)
        drawing_file_id: drawing?.drawing_file_id,
      });
    }

    return result;
  },
});

/**
 * Get all players for a finished game
 */
export const getGamePlayers = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      game_id: v.id("games"),
      player_id: v.string(),
      username: v.string(),
      avatar_url: v.optional(v.string()),
      score: v.number(),
      correct_guesses: v.number(),
      is_host: v.boolean(),
      joined_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    return players.map((p) => ({
      _id: p._id,
      game_id: p.game_id,
      player_id: p.player_id,
      username: p.username,
      avatar_url: p.avatar_url,
      score: p.score,
      correct_guesses: p.correct_guesses,
      is_host: p.is_host,
      joined_at: p.joined_at,
    }));
  },
});
