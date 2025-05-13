import type { Game } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

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
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("player_id")
      .eq("game_id", gameId)
      .order("order_index", { ascending: true });

    if (playersError) {
      console.error("Error getting players:", playersError);
      throw new Error("Failed to get players");
    }

    if (!players || players.length < 2) {
      throw new Error("Not enough players to start the game");
    }

    // Get an unused card
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

    if (!cards || cards.length === 0) {
      throw new Error("No cards available");
    }

    // Update game status - don't set timer_end yet
    const { error: updateError } = await supabase
      .from("games")
      .update({
        status: "active",
        current_drawer_id: players[0].player_id,
        current_card_id: cards[0].id,
        timer_end: null, // Don't set timer_end until drawer starts their turn
      })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game:", updateError);
      throw new Error("Failed to start game");
    }

    // Mark card as used
    await supabase.from("cards").update({ used: true }).eq("id", cards[0].id);
  } catch (error: any) {
    console.error("Error in startGame:", error);
    throw new Error(error.message || "Failed to start game");
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
