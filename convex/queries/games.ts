import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get a game by ID with all details
 */
export const getGame = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      code: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("started"),
        v.literal("finished")
      ),
      category: v.string(),
      created_by: v.string(),
      current_drawer_id: v.optional(v.string()),
      current_card_id: v.optional(v.id("cards")),
      round: v.number(),
      max_rounds: v.number(),
      created_at: v.number(),
      started_at: v.optional(v.number()),
      finished_at: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.game_id);
  },
});

/**
 * Get a game by code
 */
export const getGameByCode = query({
  args: {
    code: v.string(),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      code: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("started"),
        v.literal("finished")
      ),
      category: v.string(),
      created_by: v.string(),
      current_drawer_id: v.optional(v.string()),
      current_card_id: v.optional(v.id("cards")),
      round: v.number(),
      max_rounds: v.number(),
      created_at: v.number(),
      started_at: v.optional(v.number()),
      finished_at: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

/**
 * Get current user's active game
 */
export const getCurrentUserGame = query({
  args: {},
  returns: v.nullable(v.id("games")),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const player = await ctx.db
      .query("players")
      .withIndex("by_player_id", (q) => q.eq("player_id", identity.subject))
      .first();

    if (!player) return null;

    const game = await ctx.db.get(player.game_id);
    if (game && game.status !== "finished") {
      return game._id;
    }

    return null;
  },
});

/**
 * Get all games for user (created or joined)
 */
export const getUserGames = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("games"),
      code: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("started"),
        v.literal("finished")
      ),
      category: v.string(),
      round: v.number(),
      max_rounds: v.number(),
      created_at: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const games = await ctx.db
      .query("games")
      .withIndex("by_created_by", (q) => q.eq("created_by", identity.subject))
      .collect();

    return games.map((g) => ({
      _id: g._id,
      code: g.code,
      status: g.status,
      category: g.category,
      round: g.round,
      max_rounds: g.max_rounds,
      created_at: g.created_at,
    }));
  },
});
