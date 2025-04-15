"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { joinGame, checkUsernameAvailability } from "@/lib/game-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function JoinGamePage() {
  const [username, setUsername] = useState("")
  const [gameId, setGameId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [showGameStartedDialog, setShowGameStartedDialog] = useState(false)
  const [gameStatus, setGameStatus] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Reset username validation when username or gameId changes
  useEffect(() => {
    setUsernameAvailable(null)
    setUsernameError(null)
  }, [username, gameId])

  const handleCheckUsername = async () => {
    if (!username || !gameId) return

    setIsCheckingUsername(true)
    setUsernameError(null)
    setUsernameAvailable(null)

    try {
      const result = await checkUsernameAvailability(username, gameId)

      if (result.available) {
        setUsernameAvailable(true)
      } else {
        setUsernameError(result.message || "Username already taken. Please choose another username.")
        setUsernameAvailable(false)
      }
    } catch (error: any) {
      console.error("Error checking username:", error)
      setUsernameError("Failed to check username availability")
      setUsernameAvailable(false)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setShowGameStartedDialog(false)

    if (!username || !gameId) {
      toast({
        title: "Missing information",
        description: "Please provide your username and game ID",
        variant: "destructive",
      })
      return
    }

    // Check username availability first
    if (usernameAvailable !== true) {
      await handleCheckUsername()
      if (usernameAvailable !== true) {
        return
      }
    }

    setIsLoading(true)

    try {
      const result = await joinGame(username, gameId)

      if (result.success) {
        // Store player ID in localStorage as well for client-side access
        const playerId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("playerId="))
          ?.split("=")[1]

        if (playerId) {
          localStorage.setItem("playerId", playerId)
        }

        router.push(`/game/${gameId}`)
      } else {
        // Check if the game has already started
        if (result.gameStatus && result.gameStatus !== "waiting") {
          setGameStatus(result.gameStatus)
          setShowGameStartedDialog(true)
        } else {
          setError(result.message || "Failed to join game. Please check the game ID and try again.")
          toast({
            title: "Error",
            description: result.message || "Failed to join game. Please check the game ID and try again.",
            variant: "destructive",
          })
        }
      }
    } catch (err: any) {
      console.error("Error joining game:", err)
      setError(err.message || "Failed to join game. Please check the game ID and try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to join game. Please check the game ID and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewGame = () => {
    router.push(`/game/${gameId}`)
    setShowGameStartedDialog(false)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-4">
          <Button variant="glass" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="w-full glass-card gradient-border">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>Enter a game ID to join an existing Pictionary game</CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          <form onSubmit={handleJoinGame}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameId">Game ID</Label>
                <Input
                  id="gameId"
                  placeholder="Enter the game ID"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  required
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Your Username</Label>
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className={`glass-card ${
                        usernameAvailable === true
                          ? "border-green-500"
                          : usernameAvailable === false
                            ? "border-red-500"
                            : ""
                      }`}
                    />
                    {usernameError && <p className="text-sm text-red-500 mt-1">{usernameError}</p>}
                    {usernameAvailable === true && (
                      <p className="text-sm text-green-500 mt-1 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Username available
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCheckUsername}
                    disabled={!username || !gameId || isCheckingUsername}
                    className="shrink-0"
                  >
                    {isCheckingUsername ? "Checking..." : "Check"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                {isLoading ? "Joining Game..." : "Join Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Game Already Started Dialog */}
      <Dialog open={showGameStartedDialog} onOpenChange={setShowGameStartedDialog}>
        <DialogContent className="glass-card gradient-border">
          <DialogHeader>
            <DialogTitle>Game Already Started</DialogTitle>
            <DialogDescription>
              This game has already {gameStatus === "completed" ? "ended" : "started"} and is not accepting new players.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Game Status: {gameStatus === "completed" ? "Completed" : "In Progress"}</AlertTitle>
              <AlertDescription>
                {gameStatus === "completed"
                  ? "This game has already ended. You can view the results or create a new game."
                  : "This game is currently in progress. You can spectate the game or create a new one."}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="glass" onClick={() => setShowGameStartedDialog(false)} className="sm:order-1">
              Go Back
            </Button>
            <Button variant="gradient" onClick={handleViewGame} className="sm:order-2">
              {gameStatus === "completed" ? "View Results" : "Spectate Game"}
            </Button>
            <Link href="/new-game" className="w-full sm:w-auto sm:order-3">
              <Button variant="outline" className="w-full">
                Create New Game
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
