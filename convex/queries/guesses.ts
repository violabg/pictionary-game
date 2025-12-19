import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all guesses for a game
 */
export const getGameGuesses = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("guesses"),
      player_id: v.string(),
      guess_text: v.string(),
      is_correct: v.boolean(),
      submitted_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .order("desc")
      .take(100);

    return guesses.map((g) => ({
      _id: g._id,
      player_id: g.player_id,
      guess_text: g.guess_text,
      is_correct: g.is_correct,
      submitted_at: g.submitted_at,
    }));
  },
});

/**
 * Get guesses for a specific turn
 */
export const getTurnGuesses = query({
  args: {
    turn_id: v.id("turns"),
  },
  returns: v.array(
    v.object({
      _id: v.id("guesses"),
      player_id: v.string(),
      guess_text: v.string(),
      is_correct: v.boolean(),
      is_fuzzy_match: v.boolean(),
      submitted_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_turn_id", (q) => q.eq("turn_id", args.turn_id))
      .order("asc")
      .collect();

    return guesses.map((g) => ({
      _id: g._id,
      player_id: g.player_id,
      guess_text: g.guess_text,
      is_correct: g.is_correct,
      is_fuzzy_match: g.is_fuzzy_match,
      submitted_at: g.submitted_at,
    }));
  },
});

/**
 * Get correct guesses for a turn
 */
export const getTurnCorrectGuesses = query({
  args: {
    turn_id: v.id("turns"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_turn_id", (q) => q.eq("turn_id", args.turn_id))
      .collect();

    return guesses
      .filter((g) => g.is_correct || g.is_fuzzy_match)
      .map((g) => g.player_id);
  },
});
