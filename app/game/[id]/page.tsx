"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import GameBoard from "@/components/game-board"
import WaitingRoom from "@/components/waiting-room"
import GameOver from "@/components/game-over"
import type { Game, Player } from "@/lib/types"
import { getGame, getPlayers } from "@/lib/game-actions"

export default function GamePage() {
  const { id } = useParams()
  const gameId = Array.isArray(id) ? id[0] : id
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGameData = async () => {
      try {
        const gameData = await getGame(gameId)
        const playersData = await getPlayers(gameId)

        setGame(gameData)
        setPlayers(playersData)
      } catch (err) {
        console.error("Error loading game:", err)
        setError("Failed to load game data")
        toast({
          title: "Error",
          description: "Failed to load game data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadGameData()

    // Set up real-time subscriptions
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          setGame(payload.new as Game)
        },
      )
      .subscribe()

    const playersSubscription = supabase
      .channel(`players:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Reload players when there's any change
          getPlayers(gameId).then(setPlayers)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(gameSubscription)
      supabase.removeChannel(playersSubscription)
    }
  }, [gameId, supabase, toast])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground">{error || "Game not found"}</p>
        </div>
      </div>
    )
  }

  if (game.status === "waiting") {
    return <WaitingRoom game={game} players={players} />
  }

  if (game.status === "completed") {
    return <GameOver game={game} players={players} />
  }

  return <GameBoard game={game} players={players} />
}
