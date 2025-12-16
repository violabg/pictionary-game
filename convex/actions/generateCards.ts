"use node";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { action } from "../_generated/server";

const cardSchema = z.object({
  word: z.string().describe("The word to draw"),
  description: z.string().describe("A brief description of the word"),
});

/**
 * Generates a list of random cards from Groq API
 */
export const generateCards = action({
  args: {
    category: v.string(),
    count: v.number(),
  },
  returns: v.array(
    v.object({
      word: v.string(),
      description: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const { object: result } = await generateObject({
      model: groq("mixtral-8x7b-32768"),
      schema: z.object({
        cards: z.array(cardSchema),
      }),
      prompt: `Generate ${args.count} random drawing prompts for a Pictionary-like game in the "${args.category}" category. 
        Each card should have a word and a brief description. 
        Make them fun, varied difficulty, and appropriate for all ages.`,
      temperature: 0.7,
    });

    return result.cards;
  },
});
