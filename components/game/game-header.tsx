"use client";

import { Badge } from "@/components/ui/badge";
import { Doc } from "@/convex/_generated/dataModel";
import Timer from "./timer";

interface GameHeaderProps {
  game: Doc<"games">;
  turnStarted: boolean;
  timeRemaining: number;
  currentTurn: Doc<"turns"> | null | undefined;
  isDrawer: boolean;
  currentDrawer: Doc<"players"> | undefined;
}

export function GameHeader({
  game,
  turnStarted,
  timeRemaining,
  currentTurn,
  isDrawer,
  currentDrawer,
}: GameHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex justify-between items-center gap-2">
        <Badge variant="outline" className="px-3 py-1 text-sm">
          Categoria: {game.category}
        </Badge>
        <Badge className="px-3 py-1 text-white text-sm gradient-bg">
          Turno: {game.round} / {game.max_rounds}
        </Badge>
      </div>
      {turnStarted ? (
        <div className="flex items-center gap-4">
          <Timer
            seconds={timeRemaining}
            totalTime={60}
            isWaiting={!!currentTurn && !currentTurn.started_at}
          />
        </div>
      ) : (
        <div className="font-medium text-muted-foreground text-lg">
          {isDrawer
            ? "È il tuo turno di disegnare"
            : currentDrawer
            ? `In attesa che ${currentDrawer.username} inizi`
            : "In attesa..."}
        </div>
      )}
    </div>
  );
}
