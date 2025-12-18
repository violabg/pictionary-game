import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get current turn for a game
 */
export const getCurrentTurn = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("turns"),
      _creationTime: v.number(),
      game_id: v.id("games"),
      round: v.number(),
      drawer_id: v.string(),
      card_id: v.id("cards"),
      status: v.union(
        v.literal("drawing"),
        v.literal("completing"),
        v.literal("completed"),
        v.literal("time_up")
      ),
      time_limit: v.number(),
      started_at: v.number(),
      completed_at: v.optional(v.number()),
      correct_guesses: v.number(),
      winner_id: v.optional(v.string()),
      points_awarded: v.optional(v.number()),
      drawer_points_awarded: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .order("desc")
      .first();

    return turns || null;
  },
});

/**
 * Get all turns for a game (paginated)
 */
export const getGameTurns = query({
  args: {
    game_id: v.id("games"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("turns"),
        round: v.number(),
        drawer_id: v.string(),
        card_id: v.id("cards"),
        status: v.union(
          v.literal("drawing"),
          v.literal("completing"),
          v.literal("completed"),
          v.literal("time_up")
        ),
        started_at: v.number(),
        completed_at: v.optional(v.number()),
        correct_guesses: v.number(),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("turns")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get turns for a specific round
 */
export const getRoundTurns = query({
  args: {
    game_id: v.id("games"),
    round: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("turns"),
      drawer_id: v.string(),
      card_id: v.id("cards"),
      status: v.union(
        v.literal("drawing"),
        v.literal("completing"),
        v.literal("completed"),
        v.literal("time_up")
      ),
      started_at: v.number(),
      correct_guesses: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_game_and_round", (q) =>
        q.eq("game_id", args.game_id).eq("round", args.round)
      )
      .collect();

    return turns.map((t) => ({
      _id: t._id,
      drawer_id: t.drawer_id,
      card_id: t.card_id,
      status: t.status,
      started_at: t.started_at,
      correct_guesses: t.correct_guesses,
    }));
  },
});

/**
 * Get a specific turn
 */
export const getTurn = query({
  args: {
    turn_id: v.id("turns"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("turns"),
      _creationTime: v.number(),
      game_id: v.id("games"),
      round: v.number(),
      drawer_id: v.string(),
      card_id: v.id("cards"),
      status: v.union(
        v.literal("drawing"),
        v.literal("completing"),
        v.literal("completed"),
        v.literal("time_up")
      ),
      time_limit: v.number(),
      started_at: v.number(),
      completed_at: v.optional(v.number()),
      correct_guesses: v.number(),
      winner_id: v.optional(v.string()),
      points_awarded: v.optional(v.number()),
      drawer_points_awarded: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.turn_id);
  },
});
