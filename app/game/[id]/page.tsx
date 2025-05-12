"use client";

import GameBoard from "@/components/game/game-board";
import GameOver from "@/components/game/game-over";
import WaitingRoom from "@/components/game/waiting-room";
import { useSupabase } from "@/components/supabase-provider";
import { getGame, getPlayers } from "@/lib/game-actions";
import type { Game, Player } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function GamePage() {
  const { id } = useParams();
  const gameId = Array.isArray(id) ? id[0] : id;
  const { supabase } = useSupabase();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGameData = async () => {
      try {
        const gameData = await getGame(gameId);
        const playersData = await getPlayers(gameId);

        setGame(gameData);
        setPlayers(playersData);
      } catch (err) {
        console.error("Errore nel caricamento della partita:", err);
        setError("Impossibile caricare i dati della partita");
        toast.error("Errore", {
          description: "Impossibile caricare i dati della partita",
        });
      } finally {
        setLoading(false);
      }
    };

    loadGameData();

    // Set up real-time subscriptions
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          setGame(payload.new as Game);
        }
      )
      .subscribe();

    const playersSubscription = supabase
      .channel(`players:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Reload players when there's any change
          getPlayers(gameId).then(setPlayers);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameSubscription);
      supabase.removeChannel(playersSubscription);
    };
  }, [gameId, supabase, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen container">
        <div className="text-center">
          <div className="mx-auto border-4 border-primary border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          <p className="mt-4 text-lg">Caricamento partita...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex justify-center items-center min-h-screen container">
        <div className="text-center">
          <h2 className="mb-4 font-bold text-2xl">Errore</h2>
          <p className="text-muted-foreground">
            {error || "Partita non trovata"}
          </p>
        </div>
      </div>
    );
  }

  if (game.status === "waiting") {
    return <WaitingRoom game={game} players={players} />;
  }

  if (game.status === "completed") {
    return <GameOver game={game} players={players} />;
  }

  return <GameBoard game={game} players={players} />;
}
