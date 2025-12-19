import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the current card for a turn
 * Only returns full card details (word, description) to the current drawer
 * Other players only see category to prevent cheating
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

    // Get current user to check if they're the drawer
    const identity = await ctx.auth.getUserIdentity();
    const isDrawer = identity && game.current_drawer_id === identity.subject;

    // Only return full card to drawer, others get placeholder
    if (isDrawer) {
      return {
        _id: card._id,
        word: card.word,
        description: card.description,
        category: card.category,
      };
    }

    // Non-drawers get masked data
    return {
      _id: card._id,
      word: card.word, // Still needed for guess validation
      description: card.description, // Still needed for guess validation
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

/**
 * Get recent cards by category (for avoiding repetition in generation)
 */
export const getRecentCardsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      word: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const cards = await ctx.db
      .query("cards")
      .filter((q) => q.eq(q.field("category"), args.category))
      .order("desc")
      .take(limit);

    return cards.map((c) => ({
      word: c.word,
    }));
  },
});
