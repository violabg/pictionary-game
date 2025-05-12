"use server";

import { groq } from "@ai-sdk/groq";
import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { z } from "zod";
import type { Database } from "./database.types";

// Initialize Supabase client for server-side operations
const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Supabase URL is missing");
  }

  if (!supabaseKey) {
    throw new Error("Supabase key is missing");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Seed cards for a game
export async function seedCardsForGame(
  gameId: string,
  category: string,
  difficulty = "medium",
  playersCount: number
): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    // Calculate number of cards: 2 per player
    const numCards = Math.max(2, playersCount * 2);

    // 1. Get all previous card titles for this category and difficulty, only from games created in the last 5 hours
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const { data: recentGames, error: recentGamesError } = await supabase
      .from("games")
      .select("id")
      .eq("category", category)
      .eq("difficulty", difficulty)
      .gte("created_at", fiveHoursAgo.toISOString());
    if (recentGamesError) {
      console.error("Error fetching recent games:", recentGamesError);
      throw new Error("Failed to fetch recent games");
    }
    const recentGameIds = recentGames?.map((g) => g.id) || [];
    let previousTitlesLimited: string[] = [];
    if (recentGameIds.length > 0) {
      const { data: previousCards, error: previousCardsError } = await supabase
        .from("cards")
        .select("title, game_id")
        .in("game_id", recentGameIds);
      if (previousCardsError) {
        console.error("Error fetching previous cards:", previousCardsError);
        throw new Error("Failed to fetch previous cards");
      }
      const previousTitles = previousCards?.map((c) => c.title) || [];
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
    const prompt = `${avoidTitlesText}Sei un generatore di carte per un gioco PictionAi. Genera un array JSON di ${numCards} oggetti, ognuno con un titolo e una descrizione, per la categoria \"${category}\" e difficoltà \"${difficulty}\". Ogni oggetto deve avere la forma: { \"title\": string, \"description\": string }. Scrivi tutto in italiano. Nessun testo extra, se la difficoltà è random scegli a caso tra facile, medio e difficile. Non usare mai la parola \"carta\".`;
    const schema = z.object({
      title: z.string(),
      description: z.string(),
    });

    const result = await generateObject({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      output: "array",
      prompt,
      schema,
    });
    const cards = result.object;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      throw new Error("AI non ha generato carte valide");
    }

    const cardsToInsert = cards.map((card) => ({
      id: crypto.randomUUID(),
      game_id: gameId,
      title: card.title,
      description: card.description,
      used: false,
    }));

    const { error: insertError } = await supabase
      .from("cards")
      .insert(cardsToInsert);

    if (insertError) {
      console.error("Error inserting cards:", insertError);
      throw new Error("Failed to seed cards");
    }

    await supabase
      .from("games")
      .update({ cards_generated: true })
      .eq("id", gameId);
    console.log(
      `Successfully seeded ${cards.length} AI-generated cards for game ${gameId}`
    );
  } catch (error: any) {
    console.error("Error in seedCardsForGame (AI):", error);
    throw new Error(error.message || "Failed to seed cards");
  }
}

// Get count of cards for a game
export async function getCardCount(gameId: string): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();

    const { count, error } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (error) {
      console.error("Error counting cards:", error);
      throw new Error("Failed to count cards");
    }

    return count || 0;
  } catch (error: any) {
    console.error("Error in getCardCount:", error);
    throw new Error(error.message || "Failed to count cards");
  }
}
