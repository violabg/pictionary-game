"use node";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { RegisteredAction } from "convex/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

type SubmitGuessArgs = {
  game_id: Id<"games">;
  turn_id: Id<"turns">;
  guess_text: string;
};

type SubmitGuessResult = {
  is_correct: boolean;
  is_fuzzy_match: boolean;
  message: string;
};

/**
 * Public action to submit a guess with fully server-side validation.
 * Performs exact match and AI fuzzy matching without trusting the client,
 * then delegates all DB writes to the internal submitGuessAndCompleteTurn mutation.
 */
export const submitGuess: RegisteredAction<
  "public",
  SubmitGuessArgs,
  Promise<SubmitGuessResult>
> = action({
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
  handler: async (ctx, args): Promise<SubmitGuessResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    const turn = await ctx.runQuery(api.queries.turns.getTurn, {
      turn_id: args.turn_id,
    });
    if (!turn) throw new ConvexError("Turn not found");

    // Fetch card via internal query (word not exposed to clients)
    const card = await ctx.runQuery(internal.queries.cards.getCardById, {
      card_id: turn.card_id,
    });
    if (!card) throw new ConvexError("Card not found");

    const game = await ctx.runQuery(api.queries.games.getGame, {
      game_id: args.game_id,
    });
    if (!game) throw new ConvexError("Game not found");

    // Server-side exact match check
    const isExactMatch =
      args.guess_text.toLowerCase().trim() === card.word.toLowerCase().trim();

    // AI fuzzy validation — only when not an exact match
    let aiApproved = false;
    if (!isExactMatch) {
      const validation = await ctx.runAction(
        internal.actions.validateGuess.validateGuess,
        {
        guess: args.guess_text,
        correctAnswer: card.word,
        category: game.category,
        }
      );
      aiApproved = validation.isCorrect;
    }

    // Delegate DB writes to the internal mutation
    return await ctx.runMutation(
      internal.mutations.game.submitGuessAndCompleteTurn,
      {
      game_id: args.game_id,
      turn_id: args.turn_id,
      guess_text: args.guess_text,
      isFuzzyMatch: aiApproved,
      }
    );
  },
});
