import type {
  GetLeaderboardPlayersReturn,
  Player,
  Profile,
} from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

const supabase = createClient();

export async function addPlayerToGame(
  game_id: string,
  player_id: string,
  order_index: number
) {
  const { error } = await supabase
    .from("players")
    .insert({ game_id, player_id, order_index });
  if (error) throw error;
  return true;
}

export async function getPlayersForGame(game_id: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*, profile:player_id(id, name, full_name, user_name, avatar_url)")
    .eq("game_id", game_id)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data as (Player & { profile: Profile })[];
}

export async function getPlayerInGame(game_id: string, player_id: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game_id)
    .eq("player_id", player_id)
    .maybeSingle();
  if (error) throw error;
  return data as Player | null;
}

export async function getLeaderboardPlayers(
  supabase: SupabaseClient,
  offset: number,
  limit: number,
  languageFilter?: string
) {
  // Use Supabase RPC to get leaderboard players (overall or by language)
  const { data, error } = await supabase.rpc("get_leaderboard_players", {
    offset_value: offset,
    limit_value: limit,
    language_filter: languageFilter ?? null,
  });
  if (error) throw error;
  return (data || []) as GetLeaderboardPlayersReturn[];
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
        filter: `game_id=eq.${gameId}`,
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

export async function setPlayerInactive(game_id: string, player_id: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_active: false })
    .eq("game_id", game_id)
    .eq("player_id", player_id);
  if (error) throw error;
  return true;
}
