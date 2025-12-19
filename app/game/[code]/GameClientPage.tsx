"use client";

import GameBoard from "@/components/game/game-board";
import { GameLobby } from "@/components/game/game-lobby";
import GameOver from "@/components/game/game-over";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedUser } from "@/hooks/useAuth";
import { useGamePlayers, useGameState } from "@/hooks/useConvexSubscriptions";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function GameClientPage({
  gameId,
  code,
}: {
  gameId: Id<"games">;
  code: string;
}) {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthenticatedUser();
  const { game, isLoading: gameLoading } = useGameState(gameId);
  const { players, isLoading: playersLoading } = useGamePlayers(gameId);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const startGameMutation = useMutation(api.mutations.games.startGame);

  const handleStartGame = async () => {
    if (!game) return;
    setIsStartingGame(true);
    try {
      await startGameMutation({ game_id: gameId });
      toast.success("Partita iniziata!");
    } catch (error) {
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Impossibile avviare la partita",
      });
    } finally {
      setIsStartingGame(false);
    }
  };

  if (authLoading || gameLoading) {
    return (
      <main className="flex flex-1 justify-center items-center py-8 container">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    );
  }

  if (!game || !profile) {
    return (
      <main className="flex flex-col flex-1 justify-center items-center py-8 container">
        <h1 className="mb-4 font-bold text-2xl">Partita non trovata</h1>
        <Button onClick={() => router.push("/gioca")} variant="outline">
          Torna alla creazione del gioco
        </Button>
      </main>
    );
  }

  const isHost = game.created_by === profile.user_id;
  const isDrawer = game.current_drawer_id === profile.user_id;

  const renderGameContent = () => {
    switch (game.status) {
      case "waiting":
        return (
          <GameLobby
            gameId={gameId}
            game={game}
            players={players || []}
            isHost={isHost}
            onStartGame={handleStartGame}
            isStartingGame={isStartingGame}
          />
        );
      case "started":
        return <GameBoard gameId={gameId} code={code} />;
      case "finished":
        return <GameOver game={game} players={players || []} />;
      default:
        return (
          <>
            <h1 className="mb-4 font-bold text-2xl">Partita non trovata</h1>
            <Button onClick={() => router.push("/gioca")} variant="outline">
              Torna alla creazione del gioco
            </Button>
          </>
        );
    }
  };

  return <main className="flex-1 py-8 container">{renderGameContent()}</main>;
}
