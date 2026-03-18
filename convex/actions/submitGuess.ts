"use node";
import { getAuthUserId } from "@convex-dev/auth/server";
import { makeFunctionReference } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

// Use makeFunctionReference instead of importing from _generated/api.
// This avoids a circular type reference: api.d.ts imports typeof actions_submitGuess,
// and importing api/_internal back from submitGuess.ts would make TypeScript unable
// to resolve either type (TS7022).
const getTurnRef = makeFunctionReference<
  "query",
  { turn_id: Id<"turns"> },
  { card_id: Id<"cards">; game_id: Id<"games"> } | null
>("queries/turns:getTurn");

const getCardByIdRef = makeFunctionReference<
  "query",
  { card_id: Id<"cards"> },
  { word: string; category: string } | null
>("queries/cards:getCardById");

const getGameRef = makeFunctionReference<
  "query",
  { game_id: Id<"games"> },
  { category: string } | null
>("queries/games:getGame");

const validateGuessRef = makeFunctionReference<
  "action",
  { guess: string; correctAnswer: string; category: string },
  { isCorrect: boolean; explanation: string; submissionTimestamp: number }
>("actions/validateGuess:validateGuess");

const submitGuessAndCompleteTurnRef = makeFunctionReference<
  "mutation",
  {
    game_id: Id<"games">;
    turn_id: Id<"turns">;
    guess_text: string;
    isFuzzyMatch: boolean;
  },
  { is_correct: boolean; is_fuzzy_match: boolean; message: string }
>("mutations/game:submitGuessAndCompleteTurn");

/**
 * Public action to submit a guess with fully server-side validation.
 * Performs exact match and AI fuzzy matching without trusting the client,
 * then delegates all DB writes to the internal submitGuessAndCompleteTurn mutation.
 */
export const submitGuess = action({
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");

    const turn = await ctx.runQuery(getTurnRef, { turn_id: args.turn_id });
    if (!turn) throw new ConvexError("Turn not found");

    // Fetch card via internal query (word not exposed to clients)
    const card = await ctx.runQuery(getCardByIdRef, {
      card_id: turn.card_id,
    });
    if (!card) throw new ConvexError("Card not found");

    const game = await ctx.runQuery(getGameRef, { game_id: args.game_id });
    if (!game) throw new ConvexError("Game not found");

    // Server-side exact match check
    const isExactMatch =
      args.guess_text.toLowerCase().trim() === card.word.toLowerCase().trim();

    // AI fuzzy validation — only when not an exact match
    let aiApproved = false;
    if (!isExactMatch) {
      const validation = await ctx.runAction(validateGuessRef, {
        guess: args.guess_text,
        correctAnswer: card.word,
        category: game.category,
      });
      aiApproved = validation.isCorrect;
    }

    // Delegate DB writes to the internal mutation
    return await ctx.runMutation(submitGuessAndCompleteTurnRef, {
      game_id: args.game_id,
      turn_id: args.turn_id,
      guess_text: args.guess_text,
      isFuzzyMatch: aiApproved,
    });
  },
});
