import type { Player, Profile } from "@/lib/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import { nextTurn } from "./supabase-guess-and-turns";

const supabase = createClient();

export const addPlayerToGame = async (
  game_id: string,
  player_id: string,
  order_index: number
) => {
  const { error } = await supabase
    .from("players")
    .insert({ game_id, player_id, order_index });
  if (error) throw error;
  return true;
};

export const getPlayersForGame = async (game_id: string) => {
  const { data, error } = await supabase
    .from("players")
    .select("*, profile:player_id(id, name, full_name, user_name, avatar_url)")
    .eq("game_id", game_id)
    .order("order_index", { ascending: true });
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

export const getPlayerScore = async (playerId: string) => {
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("score")
    .eq("id", playerId)
    .single();

  if (playerError) {
    console.error("Error getting player score:", playerError);
    throw new Error("Failed to get player score");
  }

  if (!player) {
    throw new Error("Player not found");
  }
  return player.score;
};

export async function updatePlayerScore(playerId: string, newScore: number) {
  const { error: updateError } = await supabase
    .from("players")
    .update({
      score: newScore,
    })
    .eq("id", playerId);

  if (updateError) {
    console.error("Error updating score:", updateError);
    throw new Error("Failed to update score");
  }
}

// Select a winner for a correct guess
export async function selectWinner(params: {
  gameId: string;
  winnerId: string;
  winnerProfileId: string | null;
  cardId: string;
  timeRemaining: number;
  drawingImageUrl?: string;
}): Promise<void> {
  const {
    gameId,
    winnerId,
    winnerProfileId,
    cardId: currentCardId,
    timeRemaining,
    drawingImageUrl,
  } = params;
  try {
    // Get current score
    const currentScore = await getPlayerScore(winnerId);

    // Update player score
    await updatePlayerScore(winnerId, currentScore + timeRemaining);

    // Move to next turn
    await nextTurn({
      gameId,
      cardId: currentCardId,
      pointsAwarded: currentScore + timeRemaining,
      winnerProfileId: winnerProfileId,
      drawingImageUrl,
    });
  } catch (error: unknown) {
    console.error("Error in selectWinner:", error);
    const message =
      error instanceof Error ? error.message : "Failed to select winner";
    throw new Error(message);
  }
}

export async function getPlayersForGameOrdered(gameId: string) {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("player_id, order_index")
    .eq("game_id", gameId)
    .order("order_index", { ascending: true });

  if (playersError) {
    console.error("Error getting players:", playersError);
    throw new Error("Failed to get players");
  }

  if (!players || players.length === 0) {
    throw new Error("No players found");
  }
  return players;
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
  return data || [];
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
