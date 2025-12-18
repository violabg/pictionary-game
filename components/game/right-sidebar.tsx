"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Crown } from "lucide-react";
import CardDisplay from "./card-display";
import PlayerList from "./player-list";
import ScoreLegend from "./score-legend";
import TurnWinnerBanner from "./turn-winner-banner";

interface RightSidebarProps {
  game: Doc<"games">;
  sortedPlayers: Doc<"players">[];
  isDrawer: boolean;
  currentTurn: Doc<"turns"> | null | undefined;
  currentCard: {
    _id: Id<"cards">;
    word: string;
    description: string;
    category: string;
  } | null;
  winnerBannerData: {
    username: string;
    points: number;
  } | null;
  correctAnswer: string | null;
  showTimeUp: boolean;
  timeRemaining: number;
  onSelectWinner: () => void;
}

export function RightSidebar({
  game,
  sortedPlayers,
  isDrawer,
  currentTurn,
  currentCard,
  winnerBannerData,
  correctAnswer,
  showTimeUp,
  timeRemaining,
  onSelectWinner,
}: RightSidebarProps) {
  return (
    <div className="flex flex-col space-y-4">
      {game.current_drawer_id && (
        <PlayerList
          players={sortedPlayers}
          currentDrawerId={game.current_drawer_id}
        />
      )}

      {winnerBannerData && (
        <TurnWinnerBanner
          show={true}
          winner={winnerBannerData}
          correctAnswer={correctAnswer}
        />
      )}

      {showTimeUp && timeRemaining === 0 && (
        <Card className="gradient-border glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-red-500 text-lg">
              Tempo scaduto!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-2">La risposta corretta era:</p>
            <div className="mb-4 font-semibold text-xl">
              {correctAnswer || ""}
            </div>
          </CardContent>
        </Card>
      )}

      {isDrawer && currentTurn?.started_at && (
        <Button
          variant="gradient"
          size="sm"
          onClick={onSelectWinner}
          className="flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Seleziona Vincitore
        </Button>
      )}

      {isDrawer && currentCard && <CardDisplay card={currentCard} />}

      <ScoreLegend />
    </div>
  );
}
