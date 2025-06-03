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
  const { loadingState, game, isDrawer, handleStartGame } = useGameState({
    code,
    user,
  });
  const router = useRouter();

  if (loadingState === "initializing") {
    return (
      <main className="flex flex-1 justify-center items-center py-8 container">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    );
  }

  const renderGameContent = () => {
    switch (game?.status) {
      case "waiting":
        return (
          <GameLobby
            game={game}
            isDrawer={isDrawer}
            onStartGame={handleStartGame}
            loadingState={loadingState}
          />
        );
      case "active":
        return <GameBoard game={game} user={user} />;
      case "completed":
        return <GameOver game={game} />;
      default:
        return (
          <>
            <h1 className="mb-4 font-bold text-2xl">Partita non trovata</h1>
            <Button onClick={() => router.push("/gioca")} variant="outline">
              Torna alla creazione del goco
            </Button>
          </>
        );
    }
  };

  return <main className="flex-1 py-8 container">{renderGameContent()}</main>;
}
