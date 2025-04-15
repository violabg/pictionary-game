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
      toast.warning("Not enough players", {
        description: "You need at least 2 players to start the game",
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
      console.error("Error starting game:", error);
      toast.error("Error", {
        description: "Failed to start game. Please try again.",
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
      console.error("Error generating cards:", error);
      toast.error("Error", {
        description: "Failed to generate cards. Please try again.",
      });
      return false;
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    toast.success("Game ID copied", {
      description: "The game ID has been copied to your clipboard",
    });
  };

  // Format difficulty for display
  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return "Medium";
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <Card className="gradient-border w-full max-w-2xl glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Waiting Room</CardTitle>
          <CardDescription>
            Waiting for players to join the game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center p-4 rounded-md glass-card">
            <div>
              <p className="font-medium text-sm">Game ID</p>
              <p className="font-mono text-lg">{game.id}</p>
            </div>
            <Button variant="glass" size="icon" onClick={copyGameId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="mb-2 font-medium text-lg gradient-text">
              Game Settings
            </h3>
            <div className="gap-4 grid grid-cols-2">
              <div className="p-4 rounded-md glass-card">
                <p className="font-medium text-sm">Category</p>
                <p className="text-lg">{game.category}</p>
              </div>
              <div className="p-4 rounded-md glass-card">
                <p className="font-medium text-sm">Difficulty</p>
                <p className="text-lg">{formatDifficulty(game.difficulty)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-lg gradient-text">Players</h3>
            <div className="border rounded-md glass-card">
              <div className="p-4 border-white/10 border-b">
                <h4 className="font-medium">Players ({players.length})</h4>
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
                ? "Generating Cards..."
                : isStarting
                ? "Starting Game..."
                : "Start Game"}
            </Button>
          ) : (
            <p className="w-full text-muted-foreground text-center">
              Waiting for the host to start the game...
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
