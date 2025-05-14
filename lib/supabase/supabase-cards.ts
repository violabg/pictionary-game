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
    const gameData = await getGameDifficulty(gameId);

    await seedCardsForGame(
      gameId,
      category,
      gameData?.difficulty || "medium",
      playerCount
    );

    console.log(
      `Successfully generated cards for game ${gameId} using seed data with difficulty ${
        gameData?.difficulty || "medium"
      }`
    );
  } catch (error: unknown) {
    console.error("Error in generateCards:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate cards";
    throw new Error(message);
  }
}

export async function getGameDifficulty(gameId: string) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("difficulty")
    .eq("id", gameId)
    .single();

  if (gameError) {
    console.error("Error getting game difficulty:", gameError);
    throw new Error("Failed to get game difficulty");
  }
  return game;
}

export async function getCardTitle(cardId: string) {
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("title")
    .eq("id", cardId)
    .single();

  if (cardError) {
    console.error("Error getting card:", cardError);
    throw new Error("Failed to get card");
  }

  if (!card) {
    throw new Error("Card not found");
  }
  return card;
}

export async function markCardAsUsed(cardId: string) {
  const { error } = await supabase
    .from("cards")
    .update({ used: true })
    .eq("id", cardId);
  if (error) {
    console.error("Error marking card as used:", error);
    throw new Error("Failed to mark card as used");
  }
}

export async function getUnusedCard(gameId: string) {
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("id")
    .eq("game_id", gameId)
    .eq("used", false)
    .limit(1);

  if (cardsError) {
    console.error("Error getting card:", cardsError);
    throw new Error("Failed to get card");
  }

  return cards && cards.length > 0 ? cards[0] : null; // Return null if no card found
}

export type CardInsert = Pick<
  Card,
  "id" | "game_id" | "title" | "description" | "title_length" | "used"
>;

export async function getPreviousCardTitles(recentGameIds: string[]) {
  if (recentGameIds.length === 0) {
    return [];
  }
  const { data: previousCards, error: previousCardsError } = await supabase
    .from("cards")
    .select("title, game_id")
    .in("game_id", recentGameIds);

  if (previousCardsError) {
    console.error("Error fetching previous cards:", previousCardsError);
    throw new Error("Failed to fetch previous cards");
  }
  return previousCards?.map((c) => c.title) || [];
}

export async function insertGeneratedCards(cardsToInsert: CardInsert[]) {
  const { error: insertError } = await supabase
    .from("cards")
    .insert(cardsToInsert);

  if (insertError) {
    console.error("Error inserting cards:", insertError);
    throw new Error("Failed to seed cards");
  }
}
