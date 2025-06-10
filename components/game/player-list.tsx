"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerWithProfile } from "@/lib/supabase/types";
import { Pencil } from "lucide-react";
import { PlayerAvatar } from "../ui/player-avatar";

interface PlayerListProps {
  players: PlayerWithProfile[];
  currentDrawerId: string;
}

export default function PlayerList({
  players,
  currentDrawerId,
}: PlayerListProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Card className="gradient-border glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-gradient text-lg">Players</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className="flex justify-between items-center p-2 border rounded-lg"
          >
            <div className="flex items-center gap-2">
              <PlayerAvatar profile={player.profile} className="w-8 h-8" />
              <span className="font-medium">{player.profile.full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {player.player_id === currentDrawerId && (
                <Pencil className="w-4 h-4 text-primary" />
              )}
              <span className="font-bold">{player.score}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
