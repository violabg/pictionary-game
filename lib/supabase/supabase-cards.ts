import { Card } from "@/types/supabase";
import { seedCardsForGame } from "../groq";
import { createClient } from "./client";

// Initialize Supabase client for server-side operations
const supabase = createClient();

// Get a specific card
export async function getCard(cardId: string): Promise<Card> {
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (error) {
      console.error("Error getting card:", error);
      throw new Error("Card not found");
    }

    if (!data) {
      throw new Error("Card not found");
    }

    return data as Card;
  } catch (error: any) {
    console.error("Error in getCard:", error);
    throw new Error(error.message || "Failed to get card");
  }
}

// Generate cards for a game
export async function generateCards(
  gameId: string,
  category: string,
  playerCount: number
): Promise<void> {
  try {
    // Get the game to determine the difficulty
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("difficulty")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error getting game difficulty:", gameError);
      throw new Error("Failed to get game difficulty");
    }

    await seedCardsForGame(
      gameId,
      category,
      game?.difficulty || "medium",
      playerCount
    );

    console.log(
      `Successfully generated cards for game ${gameId} using seed data with difficulty ${
        game?.difficulty || "medium"
      }`
    );
  } catch (error: any) {
    console.error("Error in generateCards:", error);
    throw new Error(error.message || "Failed to generate cards");
  }
}
