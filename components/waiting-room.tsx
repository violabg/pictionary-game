"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import type { Game, Player } from "@/lib/types"
import { startGame } from "@/lib/game-actions"
import { useSupabase } from "./supabase-provider"
import { Copy } from "lucide-react"

interface WaitingRoomProps {
  game: Game
  players: Player[]
}

export default function WaitingRoom({ game, players }: WaitingRoomProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()
  const [isStarting, setIsStarting] = useState(false)
  const [isGeneratingCards, setIsGeneratingCards] = useState(false)

  const isCreator = players.length > 0 && players[0].id === localStorage.getItem("playerId")

  const handleStartGame = async () => {
    if (players.length < 2) {
      toast({
        title: "Not enough players",
        description: "You need at least 2 players to start the game",
        variant: "destructive",
      })
      return
    }

    setIsStarting(true)

    try {
      // First generate cards if not already done
      if (!game.cards_generated) {
        setIsGeneratingCards(true)
        await generateCards(game.id, game.category, players.length)
        setIsGeneratingCards(false)
      }

      // Then start the game
      await startGame(game.id)
    } catch (error) {
      console.error("Error starting game:", error)
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      })
      setIsStarting(false)
    }
  }

  const generateCards = async (gameId: string, category: string, playerCount: number) => {
    try {
      // Import the seedCardsForGame function dynamically to avoid server/client mismatch
      const { generateCards } = await import("@/lib/game-actions")
      await generateCards(gameId, category, playerCount)
      return true
    } catch (error) {
      console.error("Error generating cards:", error)
      toast({
        title: "Error",
        description: "Failed to generate cards. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id)
    toast({
      title: "Game ID copied",
      description: "The game ID has been copied to your clipboard",
    })
  }

  // Format difficulty for display
  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return "Medium"
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-2xl glass-card gradient-border">
        <CardHeader>
          <CardTitle className="gradient-text">Waiting Room</CardTitle>
          <CardDescription>Waiting for players to join the game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 glass-card rounded-md">
            <div>
              <p className="text-sm font-medium">Game ID</p>
              <p className="text-lg font-mono">{game.id}</p>
            </div>
            <Button variant="glass" size="icon" onClick={copyGameId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2 gradient-text">Game Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 glass-card rounded-md">
                <p className="text-sm font-medium">Category</p>
                <p className="text-lg">{game.category}</p>
              </div>
              <div className="p-4 glass-card rounded-md">
                <p className="text-sm font-medium">Difficulty</p>
                <p className="text-lg">{formatDifficulty(game.difficulty)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 gradient-text">Players</h3>
            <div className="border rounded-md glass-card">
              <div className="p-4 border-b border-white/10">
                <h4 className="font-medium">Players ({players.length})</h4>
              </div>
              <ul className="divide-y divide-white/10">
                {players.map((player) => (
                  <li key={player.id} className="p-4 flex items-center justify-between">
                    <span>{player.username}</span>
                    {player.id === players[0].id && (
                      <span className="text-xs gradient-bg px-2 py-1 rounded-full">Host</span>
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
              {isGeneratingCards ? "Generating Cards..." : isStarting ? "Starting Game..." : "Start Game"}
            </Button>
          ) : (
            <p className="text-center w-full text-muted-foreground">Waiting for the host to start the game...</p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
