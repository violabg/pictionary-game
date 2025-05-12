import type {
  Game,
  GenerateUniqueGameCodeArgs,
  GenerateUniqueGameCodeReturn,
} from "@/types/supabase";
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

export async function generateUniqueGameCode(
  args: GenerateUniqueGameCodeArgs = {}
): Promise<{ data: GenerateUniqueGameCodeReturn | null; error: unknown }> {
  const { data, error } = await supabase.rpc("generate_unique_game_code", args);
  return { data, error };
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

export function subscribeToGame(
  options: {
    gameId?: string;
    onUpdate: (payload: {
      eventType: string;
      new: Game | null;
      old: Game | null;
    }) => void;
  } = { onUpdate: () => {} } // Add default value for options
) {
  // Ensure options is defined
  if (!options) {
    options = { onUpdate: () => {} };
  }

  const channelName = options?.gameId ? `game-${options.gameId}` : "games";
  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
        filter: options?.gameId ? `id=eq.${options.gameId}` : undefined,
      },
      (payload: {
        eventType: string;
        new: Record<string, unknown>;
        old: Record<string, unknown>;
      }) => {
        options?.onUpdate?.({
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
