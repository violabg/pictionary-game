"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startGame } from "@/lib/game-actions";
import type { Game, Player } from "@/lib/types";
import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WaitingRoomProps {
  game: Game;
  players: Player[];
}

export default function WaitingRoom({ game, players }: WaitingRoomProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  const isCreator =
    players.length > 0 && players[0].id === localStorage.getItem("playerId");

  const handleStartGame = async () => {
    if (players.length < 2) {
      toast.warning("Giocatori insufficienti", {
        description:
          "Sono necessari almeno 2 giocatori per iniziare la partita",
      });
      return;
    }

    setIsStarting(true);

    try {
      // First generate cards if not already done
      if (!game.cards_generated) {
        setIsGeneratingCards(true);
        await generateCards(game.id, game.category, players.length);
        setIsGeneratingCards(false);
      }

      // Then start the game
      await startGame(game.id);
    } catch (error) {
      console.error("Errore nell'avvio della partita:", error);
      toast.error("Errore", {
        description: "Impossibile avviare la partita. Riprova.",
      });
      setIsStarting(false);
    }
  };

  const generateCards = async (
    gameId: string,
    category: string,
    playerCount: number
  ) => {
    try {
      // Import the seedCardsForGame function dynamically to avoid server/client mismatch
      const { generateCards } = await import("@/lib/game-actions");
      await generateCards(gameId, category, playerCount);
      return true;
    } catch (error) {
      console.error("Errore nella generazione delle carte:", error);
      toast.error("Errore", {
        description: "Impossibile generare le carte. Riprova.",
      });
      return false;
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    toast.success("ID partita copiato", {
      description: "L'ID della partita è stato copiato negli appunti",
    });
  };

  // Format difficulty for display
  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return "Media";
    if (difficulty.toLowerCase() === "easy") return "Facile";
    if (difficulty.toLowerCase() === "hard") return "Difficile";
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <Card className="gradient-border w-full max-w-2xl glass-card">
        <CardHeader>
          <CardTitle className="text-gradient">{"Sala d'attesa"}</CardTitle>
          <CardDescription>
            In attesa che i giocatori si uniscano alla partita
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center p-4 rounded-md glass-card">
            <div>
              <p className="font-medium text-sm">ID Partita</p>
              <p className="font-mono text-lg">{game.id}</p>
            </div>
            <Button variant="glass" size="icon" onClick={copyGameId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="mb-2 font-medium text-gradient text-lg">
              Impostazioni partita
            </h3>
            <div className="gap-4 grid grid-cols-2">
              <div className="p-4 rounded-md glass-card">
                <p className="font-medium text-sm">Categoria</p>
                <p className="text-lg">{game.category}</p>
              </div>
              <div className="p-4 rounded-md glass-card">
                <p className="font-medium text-sm">Difficoltà</p>
                <p className="text-lg">{formatDifficulty(game.difficulty)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-gradient text-lg">
              Giocatori
            </h3>
            <div className="border rounded-md glass-card">
              <div className="p-4 border-white/10 border-b">
                <h4 className="font-medium">Giocatori ({players.length})</h4>
              </div>
              <ul className="divide-y divide-white/10">
                {players.map((player) => (
                  <li
                    key={player.id}
                    className="flex justify-between items-center p-4"
                  >
                    <span>{player.username}</span>
                    {player.id === players[0].id && (
                      <span className="px-2 py-1 rounded-full text-xs gradient-bg">
                        Host
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isCreator ? (
            <Button
              onClick={handleStartGame}
              variant="gradient"
              disabled={isStarting || players.length < 2}
              className="w-full"
            >
              {isGeneratingCards
                ? "Generazione carte..."
                : isStarting
                  ? "Avvio partita..."
                  : "Avvia partita"}
            </Button>
          ) : (
            <p className="w-full text-muted-foreground text-center">
              {"In attesa che l'host avvii la partita..."}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
