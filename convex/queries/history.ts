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
    if (!identity) {
      return {
        page: [],
        isDone: true,
        continueCursor: null,
      };
    }

    // Extract the user ID (first part before pipe if present)
    const userId = identity.subject.split("|")[0];

    // Get all games where user participated (via players table)
    const memberships = await ctx.db
      .query("players")
      .withIndex("by_player_id", (q) => q.eq("player_id", userId))
      .collect();

    const gameIds = new Set(memberships.map((m) => m.game_id));

    // Fetch finished games
    const games: Array<{
      _id: any;
      code: string;
      category: string;
      status: "waiting" | "started" | "finished";
      created_at: number;
      round: number;
      max_rounds: number;
    }> = [];

    for (const gameId of gameIds) {
      const g = await ctx.db.get(gameId);
      if (!g) continue;
      if (g.status !== "finished") continue;
      if (
        args.category &&
        args.category !== "all" &&
        g.category !== args.category
      )
        continue;
      games.push({
        _id: g._id,
        code: g.code,
        category: g.category,
        status: g.status,
        created_at: g.created_at,
        round: g.round,
        max_rounds: g.max_rounds,
      });
    }

    // Sort by creation date desc
    games.sort((a, b) => b.created_at - a.created_at);

    // Simple cursor-based pagination using array index as cursor
    const numItems = args.paginationOpts.numItems;
    const start = args.paginationOpts.cursor
      ? Number(args.paginationOpts.cursor)
      : 0;
    const page = games.slice(start, start + numItems);
    const nextIndex = start + numItems;
    const isDone = nextIndex >= games.length;
    const continueCursor = isDone ? null : String(nextIndex);

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

    // Extract the user ID (first part before pipe if present)
    const userId = identity.subject.split("|")[0];

    // Find all games the user participated in
    const memberships = await ctx.db
      .query("players")
      .withIndex("by_player_id", (q) => q.eq("player_id", userId))
      .collect();

    const categoriesSet = new Set<string>();
    for (const m of memberships) {
      const g = await ctx.db.get(m.game_id);
      if (g && g.status === "finished") {
        categoriesSet.add(g.category);
      }
    }

    return Array.from(categoriesSet).sort();
  },
});

/**
 * Get total count of finished games for current user (for pagination)
 */
export const getUserGameCount = query({
  args: {
    category: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    // Extract the user ID (first part before pipe if present)
    const userId = identity.subject.split("|")[0];

    // Get all games where user participated (via players table)
    const memberships = await ctx.db
      .query("players")
      .withIndex("by_player_id", (q) => q.eq("player_id", userId))
      .collect();

    const gameIds = new Set(memberships.map((m) => m.game_id));

    // Count finished games
    let count = 0;
    for (const gameId of gameIds) {
      const g = await ctx.db.get(gameId);
      if (!g) continue;
      if (g.status !== "finished") continue;
      if (
        args.category &&
        args.category !== "all" &&
        g.category !== args.category
      )
        continue;
      count++;
    }

    return count;
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
        v.literal("completing"),
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
      drawer_points_awarded: v.optional(v.number()),
      points_awarded: v.optional(v.number()),
      drawing_file_id: v.optional(v.id("_storage")),
      drawing_url: v.optional(v.string()),
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

      // Get drawing URL from storage if drawing has file ID
      let drawingUrl: string | undefined = undefined;
      if (drawing?.drawing_file_id) {
        drawingUrl =
          (await ctx.storage.getUrl(drawing.drawing_file_id)) ?? undefined;
      }

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
        drawing_url: drawingUrl,
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
