"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnWithDetails } from "@/lib/supabase/types";
import { format } from "date-fns";
import { Calendar, Crown, Trophy, Users } from "lucide-react";
import Image from "next/image";

interface GameHistoryCardProps {
  game: {
    id: string;
    code: string;
    category: string;
    status: string;
    created_at: string;
    turns_count: number;
    user_score: number;
    total_turns: TurnWithDetails[];
  };
}

export default function GameHistoryCard({ game }: GameHistoryCardProps) {
  return (
    <Card className="mb-4 w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 font-bold text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Partita #{game.code}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(game.created_at), "dd/MM/yyyy HH:mm")}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {game.turns_count} turni
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">{game.category}</Badge>
            <div className="text-right">
              <div className="font-bold text-primary text-2xl">
                {game.user_score}
              </div>
              <div className="text-muted-foreground text-xs">punti totali</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {game.total_turns.length > 0 ? (
          <div className="space-y-3">
            <h4 className="mb-3 font-semibold text-sm">Turni della partita:</h4>
            <div className="gap-3 grid max-h-96 overflow-y-auto">
              {game.total_turns.map((turn, index) => (
                <div
                  key={turn.id}
                  className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8 font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {turn.card.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {turn.points_awarded} punti
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Disegnato da{" "}
                      <span className="font-medium">
                        {turn.drawer.name || turn.drawer.user_name}
                      </span>
                      {" • "}
                      Vinto da{" "}
                      <span className="flex items-center gap-1 font-medium">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        {turn.winner.name || turn.winner.user_name}
                      </span>
                    </div>
                  </div>

                  {turn.drawing_image_url && (
                    <div className="flex-shrink-0">
                      <div className="relative bg-white border rounded-lg w-16 h-16 overflow-hidden">
                        <Image
                          src={turn.drawing_image_url}
                          alt={`Disegno per "${turn.card.title}"`}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-muted-foreground text-center">
            <Trophy className="opacity-50 mx-auto mb-2 w-12 h-12" />
            <p>Nessun turno registrato per questa partita</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
