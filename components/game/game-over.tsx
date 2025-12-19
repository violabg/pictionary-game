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
import { Doc } from "@/convex/_generated/dataModel";
import { Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactConfetti from "react-confetti";
import { PlayersStanding } from "./players-standing";

interface GameOverProps {
  game: Doc<"games">;
  players: Doc<"players">[];
}

export default function GameOver({ game, players }: GameOverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    // Initial measurement
    updateDimensions();

    // Setup resize observer
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <Card
        className="gradient-border w-full max-w-2xl glass-card"
        ref={containerRef}
      >
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={500}
          colors={[
            "oklch(58.92% 0.25 296.91)", // Purple
            "oklch(65% 0.2 220)", // Blue
            "oklch(95% 0.13 90)", // Gold
            "oklch(60.2% 0.18 22.5)", // Red
            "oklch(98% 0.005 210)", // White
          ]}
          recycle={false}
          gravity={0.25}
        />
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
