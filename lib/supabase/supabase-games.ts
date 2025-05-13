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
