import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all players in a game
 */
export const getGamePlayers = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
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

    return players;
  },
});

/**
 * Get a specific player
 */
export const getPlayer = query({
  args: {
    player_id: v.id("players"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
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
    return await ctx.db.get(args.player_id);
  },
});

/**
 * Get leaderboard for a game
 */
export const getGameLeaderboard = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      username: v.string(),
      score: v.number(),
      correct_guesses: v.number(),
      avatar_url: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    return players
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        username: p.username,
        score: p.score,
        correct_guesses: p.correct_guesses,
        avatar_url: p.avatar_url,
      }));
  },
});
