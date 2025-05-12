"use client";

import GameBoard from "@/components/game/game-board";
import { GameLobby } from "@/components/game/game-lobby";
import GameOver from "@/components/game/game-over";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/hooks/useGameState";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function GameClientPage({ code, user }: { code: string; user: User }) {
  const { loadingState, game, isHost, handleStartGame, handleLeaveGame } =
    useGameState({ code, user });
  const router = useRouter();

  if (loadingState === "initializing") {
    return (
      <main className="flex flex-1 justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex flex-col flex-1 justify-center items-center py-8 container">
        <h1 className="mb-4 font-bold text-2xl">Partita non trovata</h1>
        <Button onClick={() => router.push("/dashboard")}>
          Torna alla Dashboard
        </Button>
      </main>
    );
  }

  if (game.status === "waiting") {
    return (
      <GameLobby
        game={game}
        isHost={isHost}
        onStartGame={handleStartGame}
        onLeaveGame={handleLeaveGame}
        loadingState={loadingState}
      />
    );
  }

  if (game.status === "completed") {
    return <GameOver game={game} players={game.players} />;
  }

  return <GameBoard game={game} players={game.players} />;
}
