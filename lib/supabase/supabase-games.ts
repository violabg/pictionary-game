import type { Game } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import { getUnusedCard, markCardAsUsed } from "./supabase-cards";
import { getPlayersForGameOrdered } from "./supabase-players";

const supabase = createClient();

export async function createGame(
  current_drawer_id: string,
  max_players: number,
  category: string,
  difficulty = "medium",
  timer: number = 120
) {
  const { data, error } = await supabase
    .from("games")
    .insert({
      current_drawer_id,
      max_players,
      code: "",
      category,
      status: "waiting",
      cards_generated: false,
      difficulty: difficulty, // Store the difficulty level
      timer,
    })
    .select()
    .single();
  if (error) throw error;
  return { data: data as Game, error };
}

export async function getGameByCode(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (error) throw error;
  return { data: data as Game, error };
}

export async function getGameCurrentCardId(gameId: string) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("current_card_id")
    .eq("id", gameId)
    .single();

  if (gameError) {
    console.error("Error getting current card:", gameError);
    throw new Error("Failed to get current card");
  }

  if (!game || !game.current_card_id) {
    throw new Error("No active card found");
  }
  return game.current_card_id;
}

export async function getGameCurrentDrawerId(gameId: string) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("current_drawer_id")
    .eq("id", gameId)
    .single();

  if (gameError) {
    console.error("Error getting game:", gameError);
    throw new Error("Failed to get game");
  }

  if (!game) {
    throw new Error("Game not found");
  }
  return game.current_drawer_id;
}

export const updateGameTurn = async (gameId: string, nextTurn: number) => {
  const { error } = await supabase
    .from("games")
    .update({ current_turn: nextTurn })
    .eq("id", gameId);
  return { error };
};

export const updateGameStatus = async (
  gameId: string,
  status: "waiting" | "active" | "completed"
) => {
  const { error } = await supabase
    .from("games")
    .update({ status })
    .eq("id", gameId);
  return { error };
};

// Start the game
export async function startGame(gameId: string): Promise<void> {
  try {
    // Get players
    const players = await getPlayersForGameOrdered(gameId);

    if (!players || players.length < 2) {
      throw new Error("Not enough players to start the game");
    }

    // Get an unused card
    const card = await getUnusedCard(gameId);
    if (!card) {
      throw new Error("No unused card available for the game");
    }

    // Update game status - don't set timer_end yet
    const { error: updateError } = await supabase
      .from("games")
      .update({
        status: "active",
        current_drawer_id: players[0].player_id,
        current_card_id: card.id,
        timer_end: null, // Don't set timer_end until drawer starts their turn
      })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game:", updateError);
      throw new Error("Failed to start game");
    }

    // Mark card as used
    await markCardAsUsed(card.id);
  } catch (error: unknown) {
    console.error("Error in startGame:", error);
    const message =
      error instanceof Error ? error.message : "Failed to start game";
    throw new Error(message);
  }
}

export function subscribeToGame(options: {
  gameId: string;
  onUpdate: (payload: {
    eventType: string;
    new: Game | null;
    old: Game | null;
  }) => void;
}) {
  const { gameId, onUpdate } = options;
  return supabase
    .channel(`game:${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      },
      (payload: {
        eventType: string;
        new: Record<string, unknown>;
        old: Record<string, unknown>;
      }) => {
        onUpdate({
          eventType: payload.eventType,
          new: payload.new as Game | null,
          old: payload.old as Game | null,
        });
      }
    )
    .subscribe();
}

export function unsubscribeFromGame(channel: { unsubscribe: () => void }) {
  channel.unsubscribe();
}

export async function getRecentGamesForCategory(
  category: string,
  difficulty: string,
  fromDate: string
) {
  const { data: recentGames, error: recentGamesError } = await supabase
    .from("games")
    .select("id")
    .eq("category", category)
    .eq("difficulty", difficulty)
    .gte("created_at", fromDate);

  if (recentGamesError) {
    console.error("Error fetching recent games:", recentGamesError);
    throw new Error("Failed to fetch recent games");
  }
  return recentGames;
}

export async function updateGamePostCardGeneration(
  gameId: string,
  firstCardTitleLength: number
) {
  const { error } = await supabase
    .from("games")
    .update({
      cards_generated: true,
      card_title_length: firstCardTitleLength,
    })
    .eq("id", gameId);

  if (error) {
    console.error("Error updating game post card generation:", error);
    throw new Error("Failed to update game post card generation");
  }
}

export async function updateGameForNextTurn(
  gameId: string,
  nextDrawerId: string,
  nextCardId: string
) {
  const { error: updateError } = await supabase
    .from("games")
    .update({
      current_drawer_id: nextDrawerId,
      current_card_id: nextCardId,
      timer_end: null, // Reset timer for next turn
    })
    .eq("id", gameId);

  if (updateError) {
    console.error("Error updating game for next turn:", updateError);
    throw new Error("Failed to update game for next turn");
  }
}

export async function getGameTimerDuration(gameId: string) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("timer") // Assuming 'timer' column stores duration in seconds
    .eq("id", gameId)
    .single();

  if (gameError) {
    console.error("Error getting game timer:", gameError);
    throw new Error("Failed to get game timer");
  }

  if (!game) {
    throw new Error("Game not found");
  }
  return game.timer;
}

export async function updateGameTimerEnd(gameId: string, timerEnd: string) {
  const { error: updateError } = await supabase
    .from("games")
    .update({ timer_end: timerEnd })
    .eq("id", gameId);

  if (updateError) {
    console.error("Error starting turn (updating timer_end):", updateError);
    throw new Error("Failed to start turn (updating timer_end)");
  }
}

export async function setGameAsCompleted(gameId: string) {
  const { error: endError } = await supabase
    .from("games")
    .update({
      status: "completed",
      current_drawer_id: null,
      current_card_id: null,
      timer_end: null,
    })
    .eq("id", gameId);

  if (endError) {
    console.error("Error ending game:", endError);
    throw new Error("Failed to end game");
  }
}
