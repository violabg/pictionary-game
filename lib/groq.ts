"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import {
  CardInsert,
  getPreviousCardTitles,
  insertGeneratedCards,
} from "./supabase/supabase-cards";
import {
  getRecentGamesForCategory,
  updateGamePostCardGeneration,
} from "./supabase/supabase-games";
import { LLM_MODEL } from "./utils";

// Seed cards for a game
export async function seedCardsForGame(
  gameId: string,
  category: string,
  difficulty = "medium",
  playersCount: number
): Promise<void> {
  try {
    // Calculate number of cards: 2 per player
    const numCards = Math.max(2, playersCount * 2);

    // 1. Get all previous card titles for this category and difficulty, only from games created in the last 5 hours
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const recentGames = await getRecentGamesForCategory(
      category,
      difficulty,
      fiveHoursAgo.toISOString()
    );

    const recentGameIds = recentGames?.map((g: { id: string }) => g.id) || [];
    let previousTitlesLimited: string[] = [];
    if (recentGameIds.length > 0) {
      const previousTitles = await getPreviousCardTitles(recentGameIds);
      // Limit to last 50 titles to keep prompt size reasonable
      previousTitlesLimited = previousTitles.slice(-50);
    }
    const avoidTitlesText =
      previousTitlesLimited.length > 0
        ? `Evita di generare carte con questi titoli già usati in precedenza per questa categoria e difficoltà (ultime 5 ore): ${previousTitlesLimited
            .map((t) => `"${t}"`)
            .join(", ")}. `
        : "";

    // 2. Add constraint to prompt
    const prompt = `${avoidTitlesText} Sei un generatore di carte per un gioco Pictionary. Genera un array JSON di ${numCards} oggetti, ognuno con un titolo e una descrizione, per la categoria \"${category}\" e difficoltà \"${difficulty}\". Ogni oggetto deve avere la forma: { \"title\": string, \"description\": string }. Scrivi tutto in italiano, tranne che per i termini tecnici comuni specialmente nella categoria tecnologia. Il title deve essere massimo di 3 parole Nessun testo extra, se la difficoltà è random scegli a caso tra facile, medio e difficile. Non usare mai la parola \"carta\".`;
    const schema = z.object({
      title: z.string(),
      description: z.string(),
    });

    const result = await generateObject({
      model: groq(LLM_MODEL),
      output: "array",
      prompt,
      schema,
    });
    const cards = result.object;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      throw new Error("AI non ha generato carte valide");
    }

    const cardsToInsert: CardInsert[] = cards.map((card) => ({
      id: crypto.randomUUID(),
      game_id: gameId,
      title: card.title,
      description: card.description,
      title_length: card.title.split(" ").length,
      used: false,
    }));

    await insertGeneratedCards(cardsToInsert);

    await updateGamePostCardGeneration(
      gameId,
      cardsToInsert[0].title_length || 0
    );
  } catch (error: unknown) {
    console.error("Error in seedCardsForGame (AI):", error);
    const message =
      error instanceof Error ? error.message : "Failed to seed cards";
    throw new Error(message);
  }
}
