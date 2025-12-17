import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the current card for a turn
 */
export const getCurrentCard = query({
  args: {
    game_id: v.optional(v.id("games")),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("cards"),
      word: v.string(),
      description: v.string(),
      category: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.game_id) return null;

    const game = await ctx.db.get(args.game_id);
    if (!game || !game.current_card_id) return null;

    const card = await ctx.db.get(game.current_card_id);
    if (!card) return null;

    return {
      _id: card._id,
      word: card.word,
      description: card.description,
      category: card.category,
    };
  },
});

/**
 * Get an unused card for a game
 */
export const getUnusedCard = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.nullable(
    v.object({
      _id: v.id("cards"),
      word: v.string(),
      description: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_game_and_unused", (q) =>
        q.eq("game_id", args.game_id).eq("is_used", false)
      )
      .first();

    if (!card) return null;

    return {
      _id: card._id,
      word: card.word,
      description: card.description,
    };
  },
});

/**
 * Get all cards for a game
 */
export const getGameCards = query({
  args: {
    game_id: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("cards"),
      word: v.string(),
      description: v.string(),
      is_used: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_game_id", (q) => q.eq("game_id", args.game_id))
      .collect();

    return cards.map((c) => ({
      _id: c._id,
      word: c.word,
      description: c.description,
      is_used: c.is_used,
    }));
  },
});
