"use client"

import type { Player } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Pencil } from "lucide-react"

interface PlayerListProps {
  players: Player[]
  currentDrawerId: string
}

export default function PlayerList({ players, currentDrawerId }: PlayerListProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <Card className="glass-card gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg gradient-text">Players</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-white/10">
          {sortedPlayers.map((player) => (
            <li
              key={player.id}
              className={`flex items-center justify-between p-4 ${player.id === currentDrawerId ? "bg-white/5" : ""}`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{player.username}</span>
              </div>
              <div className="flex items-center space-x-2">
                {player.id === currentDrawerId && <Pencil className="h-4 w-4 text-primary" />}
                <span className="font-bold">{player.score}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
