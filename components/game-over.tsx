"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Game, Player } from "@/lib/types"
import { Trophy, Medal, Award, Home } from "lucide-react"

interface GameOverProps {
  game: Game
  players: Player[]
}

export default function GameOver({ game, players }: GameOverProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  // Get top 3 players
  const winners = sortedPlayers.slice(0, 3)

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-2xl glass-card gradient-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl gradient-text">Game Over!</CardTitle>
          <CardDescription>Category: {game.category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center items-end space-x-4 py-8">
            {winners.length > 1 && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-2">
                  <Medal className="h-8 w-8 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{winners[1].username}</p>
                  <p className="text-2xl font-bold">{winners[1].score}</p>
                </div>
              </div>
            )}

            {winners.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mb-2">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{winners[0].username}</p>
                  <p className="text-3xl font-bold gradient-text">{winners[0].score}</p>
                </div>
              </div>
            )}

            {winners.length > 2 && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-2">
                  <Award className="h-8 w-8 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{winners[2].username}</p>
                  <p className="text-2xl font-bold">{winners[2].score}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-md glass-card">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-medium">Final Scores</h3>
            </div>
            <ul className="divide-y divide-white/10">
              {sortedPlayers.map((player, index) => (
                <li key={player.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-muted-foreground">#{index + 1}</span>
                    <span>{player.username}</span>
                  </div>
                  <span className="font-bold">{player.score}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Link href="/" className="w-full max-w-xs">
            <Button variant="gradient" className="w-full flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/new-game" className="w-full max-w-xs">
            <Button variant="glass" className="w-full">
              Play Again
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
