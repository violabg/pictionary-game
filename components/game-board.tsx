"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "./supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import DrawingCanvas from "./drawing-canvas"
import PlayerList from "./player-list"
import GuessInput from "./guess-input"
import Timer from "./timer"
import CardDisplay from "./card-display"
import SelectWinnerModal from "./select-winner-modal"
import type { Game, Player, Card } from "@/lib/types"
import { getCard, submitGuess, selectWinner, nextTurn, startTurn } from "@/lib/game-actions"
import { Button } from "./ui/button"
import { PlayCircle, Crown } from "lucide-react"

interface GameBoardProps {
  game: Game
  players: Player[]
}

export default function GameBoard({ game, players }: GameBoardProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [isDrawer, setIsDrawer] = useState(false)
  const [correctGuessers, setCorrectGuessers] = useState<Player[]>([])
  const [showSelectWinnerModal, setShowSelectWinnerModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [turnStarted, setTurnStarted] = useState(false)
  const [isStartingTurn, setIsStartingTurn] = useState(false)

  const playerId = localStorage.getItem("playerId")
  const currentPlayer = players.find((p) => p.id === playerId)

  useEffect(() => {
    // Check if current player is the drawer
    setIsDrawer(game.current_drawer_id === playerId)

    // Load the current card if we're the drawer
    if (game.current_drawer_id === playerId && game.current_card_id) {
      getCard(game.current_card_id).then(setCurrentCard)
    } else {
      setCurrentCard(null)
    }

    // Check if turn has started based on timer_end
    setTurnStarted(!!game.timer_end)

    // Calculate time remaining if turn has started
    if (game.timer_end) {
      const endTime = new Date(game.timer_end).getTime()
      const updateTimer = () => {
        const now = new Date().getTime()
        const diff = Math.max(0, Math.floor((endTime - now) / 1000))
        setTimeRemaining(diff)

        if (diff <= 0 && isDrawer) {
          // If time's up and we're the drawer, move to next turn
          nextTurn(game.id)
          clearInterval(timerInterval)
        }
      }

      updateTimer()
      const timerInterval = setInterval(updateTimer, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [game, playerId, isDrawer])

  // Subscribe to guesses
  useEffect(() => {
    const guessSubscription = supabase
      .channel(`guesses:${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guesses",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          const guess = payload.new as any

          // If we're the drawer and this is a correct guess
          if (isDrawer && guess.is_correct && !correctGuessers.some((p) => p.id === guess.player_id)) {
            // Find the player who made the guess
            const guesser = players.find((p) => p.id === guess.player_id)
            if (guesser) {
              setCorrectGuessers((prev) => [...prev, guesser])

              // Show toast notification
              toast({
                title: "Correct Guess!",
                description: `${guesser.username} guessed correctly and earned ${timeRemaining} points!`,
                variant: "default",
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(guessSubscription)
    }
  }, [game.id, supabase, isDrawer, players, correctGuessers, toast, timeRemaining])

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPlayer) return

    try {
      await submitGuess(game.id, currentPlayer.id, guess, timeRemaining)
    } catch (error) {
      console.error("Error submitting guess:", error)
      toast({
        title: "Error",
        description: "Failed to submit guess",
        variant: "destructive",
      })
    }
  }

  const handleSelectWinner = async (winnerId: string) => {
    try {
      await selectWinner(game.id, winnerId, timeRemaining)
      setShowSelectWinnerModal(false)
      setCorrectGuessers([])
    } catch (error) {
      console.error("Error selecting winner:", error)
      toast({
        title: "Error",
        description: "Failed to select winner",
        variant: "destructive",
      })
    }
  }

  const handleStartTurn = async () => {
    if (!isDrawer) return

    setIsStartingTurn(true)
    try {
      await startTurn(game.id)
      setTurnStarted(true)
    } catch (error) {
      console.error("Error starting turn:", error)
      toast({
        title: "Error",
        description: "Failed to start turn",
        variant: "destructive",
      })
    } finally {
      setIsStartingTurn(false)
    }
  }

  const handleOpenSelectWinner = () => {
    if (!isDrawer || !turnStarted) return
    setShowSelectWinnerModal(true)
  }

  return (
    <div className="container py-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold gradient-text">Pictionary: {game.category}</h1>
        {turnStarted ? (
          <div className="flex items-center gap-4">
            <Timer seconds={timeRemaining} />
            {isDrawer && (
              <Button variant="gradient" size="sm" onClick={handleOpenSelectWinner} className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Select Winner
              </Button>
            )}
          </div>
        ) : (
          <div className="text-lg font-medium text-muted-foreground">
            {isDrawer ? "Your turn to draw" : "Waiting for drawer to start"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow">
        <div className="md:col-span-3 flex flex-col">
          <div className="glass-card gradient-border rounded-lg p-4 flex-grow">
            <DrawingCanvas
              gameId={game.id}
              isDrawer={isDrawer}
              currentDrawerId={game.current_drawer_id}
              turnStarted={turnStarted}
            />

            {isDrawer && !turnStarted && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleStartTurn}
                  disabled={isStartingTurn}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-5 w-5" />
                  {isStartingTurn ? "Starting Turn..." : "Start Your Turn"}
                </Button>
              </div>
            )}
          </div>

          {!isDrawer && turnStarted && (
            <div className="mt-4">
              <GuessInput onSubmit={handleGuessSubmit} disabled={isDrawer} />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <PlayerList players={players} currentDrawerId={game.current_drawer_id} />

          {isDrawer && currentCard && <CardDisplay card={currentCard} />}
        </div>
      </div>

      {showSelectWinnerModal && (
        <SelectWinnerModal
          players={players.filter((p) => p.id !== game.current_drawer_id)}
          onSelectWinner={handleSelectWinner}
          onClose={() => setShowSelectWinnerModal(false)}
          timeRemaining={timeRemaining}
        />
      )}
    </div>
  )
}
