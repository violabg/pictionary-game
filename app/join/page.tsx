"use client";

import type React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkUsernameAvailability, joinGame } from "@/lib/game-actions";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function JoinGamePage() {
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [showGameStartedDialog, setShowGameStartedDialog] = useState(false);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const router = useRouter();

  // Reset username validation when username or gameId changes
  useEffect(() => {
    setUsernameAvailable(null);
    setUsernameError(null);
  }, [username, gameId]);

  const handleCheckUsername = async () => {
    if (!username || !gameId) return;

    setIsCheckingUsername(true);
    setUsernameError(null);
    setUsernameAvailable(null);

    try {
      const result = await checkUsernameAvailability(username, gameId);

      if (result.available) {
        setUsernameAvailable(true);
      } else {
        setUsernameError(
          result.message ||
            "Username already taken. Please choose another username."
        );
        setUsernameAvailable(false);
      }
    } catch (error: any) {
      console.error("Error checking username:", error);
      setUsernameError("Failed to check username availability");
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowGameStartedDialog(false);

    if (!username || !gameId) {
      toast.error("Missing information", {
        description: "Please provide your username and game ID",
      });
      return;
    }

    // Check username availability first
    if (usernameAvailable !== true) {
      await handleCheckUsername();
      if (usernameAvailable !== true) {
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await joinGame(username, gameId);

      if (result.success) {
        // Store player ID in localStorage as well for client-side access
        const playerId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("playerId="))
          ?.split("=")[1];

        if (playerId) {
          localStorage.setItem("playerId", playerId);
        }

        router.push(`/game/${gameId}`);
      } else {
        // Check if the game has already started
        if (result.gameStatus && result.gameStatus !== "waiting") {
          setGameStatus(result.gameStatus);
          setShowGameStartedDialog(true);
        } else {
          setError(
            result.message ||
              "Failed to join game. Please check the game ID and try again."
          );
          toast.error("Error", {
            description:
              result.message ||
              "Failed to join game. Please check the game ID and try again.",
          });
        }
      }
    } catch (err: any) {
      console.error("Error joining game:", err);
      setError(
        err.message ||
          "Failed to join game. Please check the game ID and try again."
      );
      toast.error("Error", {
        description:
          err.message ||
          "Failed to join game. Please check the game ID and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewGame = () => {
    router.push(`/game/${gameId}`);
    setShowGameStartedDialog(false);
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-4">
          <Button variant="glass" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="gradient-border w-full glass-card">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>
              Enter a game ID to join an existing Pictionary game
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
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
                  <div className="grow">
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
                    {usernameError && (
                      <p className="mt-1 text-red-500 text-sm">
                        {usernameError}
                      </p>
                    )}
                    {usernameAvailable === true && (
                      <p className="flex items-center mt-1 text-green-500 text-sm">
                        <Check className="mr-1 w-3 h-3" /> Username available
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
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Joining Game..." : "Join Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Game Already Started Dialog */}
      <Dialog
        open={showGameStartedDialog}
        onOpenChange={setShowGameStartedDialog}
      >
        <DialogContent className="gradient-border glass-card">
          <DialogHeader>
            <DialogTitle>Game Already Started</DialogTitle>
            <DialogDescription>
              This game has already{" "}
              {gameStatus === "completed" ? "ended" : "started"} and is not
              accepting new players.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>
                Game Status:{" "}
                {gameStatus === "completed" ? "Completed" : "In Progress"}
              </AlertTitle>
              <AlertDescription>
                {gameStatus === "completed"
                  ? "This game has already ended. You can view the results or create a new game."
                  : "This game is currently in progress. You can spectate the game or create a new one."}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex sm:flex-row flex-col gap-2">
            <Button
              variant="glass"
              onClick={() => setShowGameStartedDialog(false)}
              className="sm:order-1"
            >
              Go Back
            </Button>
            <Button
              variant="gradient"
              onClick={handleViewGame}
              className="sm:order-2"
            >
              {gameStatus === "completed" ? "View Results" : "Spectate Game"}
            </Button>
            <Link href="/new-game" className="sm:order-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Create New Game
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
