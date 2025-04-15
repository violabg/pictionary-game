"use server";

import { openai } from "@ai-sdk/openai";
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
    const prompt = `Sei un generatore di carte per un gioco Pictionary. Genera un array JSON di ${numCards} oggetti, ognuno con un titolo e una descrizione, per la categoria \"${category}\" e difficoltà \"${difficulty}\". Ogni oggetto deve avere la forma: { \"title\": string, \"description\": string }. Scrivi tutto in italiano. Nessun testo extra, solo l'array.`;
    const schema = z.object({
      title: z.string(),
      description: z.string(),
    });

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
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
