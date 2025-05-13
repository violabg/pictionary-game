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
import { GameWithPlayers } from "@/types/supabase";
import { Home } from "lucide-react";
import Link from "next/link";
import { PlayersStanding } from "./players-standing";

interface GameOverProps {
  game: GameWithPlayers;
}

export default function GameOver({ game }: GameOverProps) {
  const players = game.players;

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <Card className="gradient-border w-full max-w-2xl glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-gradient text-3xl">Game Over!</CardTitle>
          <CardDescription>Categoria: {game.category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <PlayersStanding players={players} />
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Link href="/" className="w-full max-w-xs">
            <Button
              variant="gradient"
              className="flex items-center gap-2 w-full"
            >
              <Home className="w-4 h-4" />
              Torna alla Home
            </Button>
          </Link>
          <Link href="/gioca" className="w-full max-w-xs">
            <Button variant="outline" className="w-full">
              Gioca ancora
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
