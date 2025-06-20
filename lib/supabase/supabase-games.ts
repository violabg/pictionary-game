import type { Game } from "@/lib/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

const supabase = createClient();

export const createGame = async (
  current_drawer_id: string,
  max_players: number,
  category: string,
  difficulty = "medium",
  timer: number = 120
) => {
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
};

export const getGameByCode = async (supabase: SupabaseClient, code: string) => {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (error) throw error;
  return { data: data as Game, error };
};

export const getGameCurrentCardId = async (gameId: string) => {
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
};

export const getRecentGamesForCategory = async (
  category: string,
  difficulty: string,
  fromDate: string
) => {
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
};

export const updateGamePostCardGeneration = async (
  gameId: string,
  firstCardTitleLength: number
) => {
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
};

export const getGameTimerDuration = async (gameId: string) => {
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
};

export const updateGameTimerEnd = async (gameId: string, timerEnd: string) => {
  const { error: updateError } = await supabase
    .from("games")
    .update({ timer_end: timerEnd })
    .eq("id", gameId);

  if (updateError) {
    console.error("Error starting turn (updating timer_end):", updateError);
    throw new Error("Failed to start turn (updating timer_end)");
  }
};

export const subscribeToGame = (options: {
  gameId: string;
  onUpdate: (payload: {
    eventType: string;
    new: Game | null;
    old: Game | null;
  }) => void;
}) => {
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
};

export const unsubscribeFromGame = (channel: { unsubscribe: () => void }) => {
  channel.unsubscribe();
};
