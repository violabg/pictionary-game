import {
  getGameByCode,
  subscribeToGame,
  unsubscribeFromGame,
  updateGameStatus,
} from "@/lib/supabase/supabase-games";
import {
  getPlayersForGame,
  getPlayersForGameOrdered,
  setPlayerInactive,
  subscribeToGamePlayers,
  unsubscribeFromGamePlayers,
} from "@/lib/supabase/supabase-players";
import { getProfileById } from "@/lib/supabase/supabase-profiles";
import type { GameWithPlayers } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "../supabase/client";
import { getUnusedCard, markCardAsUsed } from "../supabase/supabase-cards";

const supabase = createClient();
type LoadingState = "idle" | "initializing" | "starting";

// Start the game
const startGame = async (gameId: string): Promise<void> => {
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
};

export function useGameState({
  code,
  user,
}: {
  code: string;
  user: User | null;
}) {
  const router = useRouter();
  const [loadingState, setLoadingState] =
    useState<LoadingState>("initializing");
  const [game, setGame] = useState<GameWithPlayers | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isDrawer, setIsDrawer] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!user) return;
      try {
        const { data: gameData } = await getGameByCode(supabase, code);
        const playersData = await getPlayersForGame(gameData.id);
        const hostData = await getProfileById(gameData.current_drawer_id ?? "");
        setIsDrawer(user.id === gameData.current_drawer_id);
        const gameWithPlayers = {
          ...gameData,
          players: playersData,
          host: hostData,
        } as GameWithPlayers;
        setGame(gameWithPlayers);
        setGameId(gameData.id);
      } catch (error) {
        console.error("Error fetching game:", error);
        toast.error("Errore", {
          description:
            "Impossibile caricare i dati della partita: " +
            (error instanceof Error ? error.message : String(error)),
        });
        router.push("/gioca");
      } finally {
        setLoadingState("idle");
      }
    };

    fetchGame();
  }, [user, code, router]);

  useEffect(() => {
    if (!user || !gameId) return;

    const gameSubscription = subscribeToGame({
      gameId,
      onUpdate: (payload) => {
        if (payload.eventType === "DELETE") {
          setGame(null);
          toast("La partita è stata chiusa.");
          router.push("/gioca");
          return;
        }
        setGame((currentGame) => {
          if (!currentGame) return null;
          return { ...currentGame, ...payload.new };
        });
      },
    });

    const playersSubscription = subscribeToGamePlayers(gameId, async () => {
      const playersData = await getPlayersForGame(gameId);
      setGame((currentGame) => {
        if (!currentGame) return null;
        return { ...currentGame, players: playersData };
      });
    });

    return () => {
      unsubscribeFromGame(gameSubscription);
      unsubscribeFromGamePlayers(playersSubscription);
    };
  }, [user, router, gameId]);

  const handleStartGame = async () => {
    if (!game || !isDrawer) return;
    try {
      setLoadingState("starting");
      await startGame(game.id);
      setGame((currentGame) => {
        if (!currentGame) return null;
        return { ...currentGame, status: "active" };
      });
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          "Impossibile avviare la partita: " +
          (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const handleLeaveGame = async () => {
    if (!game || !user) return;
    try {
      if (isDrawer) {
        await updateGameStatus(game.id, "completed");
      } else {
        await setPlayerInactive(game.id, user.id);
      }
      router.push("/gioca");
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          "Impossibile uscire dalla partita: " +
          (error instanceof Error ? error.message : String(error)),
      });
    }
  };

  return {
    loadingState,
    game,
    isDrawer,
    handleStartGame,
    handleLeaveGame,
  };
}
