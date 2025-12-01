import type { Player, Profile } from "@/lib/supabase/types";
import { createClient } from "./client";

const supabase = createClient();

export const addPlayerToGame = async (
  game_id: string,
  player_id: string,
  order_index: number
) => {
  const { error } = await supabase
    .from("players")
    .insert({
    game_id,
    player_id,
    order_index
  });
  if (error) throw error;
  return true;
};

export const getPlayersForGame = async (game_id: string) => {
  const { data, error } = await supabase
    .from("players")
    .select("*, profile:player_id(id, name, full_name, user_name, avatar_url)")
    .eq("game_id", game_id)
    .order("order_index", {
    ascending: true
  });
  if (error) throw error;
  return data as (Player & { profile: Profile })[];
};

export const getPlayerInGame = async (game_id: string, player_id: string) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game_id)
    .eq("player_id", player_id)
    .maybeSingle();
  if (error) throw error;
  return data as Player | null;
};

export async function getPlayersForGameOrdered(gameId: string) {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("player_id, order_index")
    .eq("game_id", gameId)
    .order("order_index", {
    ascending: true
  });

  if (playersError) {
    console.error("Error getting players:", playersError);
    throw new Error("Failed to get players");
  }

  if (!players || players.length === 0) {
    throw new Error("No players found");
  }
  return players;
}

export function subscribeToGamePlayers(
  gameId: string,
  handler: (payload: {
    eventType: string;
    new: Player | null;
    old: Player | null;
  }) => void
) {
  return supabase
    .channel(`players:${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        handler({
          eventType: payload.eventType,
          new: payload.new as Player | null,
          old: payload.old as Player | null,
        });
      }
    )
    .subscribe();
}

export function unsubscribeFromGamePlayers(channel: {
  unsubscribe: () => void;
}) {
  channel.unsubscribe();
}
