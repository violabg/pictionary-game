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

  // Make handleCheckUsername return a boolean indicating username availability
  const handleCheckUsername = async (): Promise<boolean> => {
    if (!username || !gameId) return false;

    setIsCheckingUsername(true);
    setUsernameError(null);
    setUsernameAvailable(null);

    try {
      const result = await checkUsernameAvailability(username, gameId);

      if (result.available) {
        setUsernameAvailable(true);
        return true;
      } else {
        setUsernameError(
          result.message || "Nome già utilizzato. Scegli un altro nome."
        );
        setUsernameAvailable(false);
        return false;
      }
    } catch (error: any) {
      console.error("Error checking username:", error);
      setUsernameError("Impossibile verificare la disponibilità del nome");
      setUsernameAvailable(false);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Update handleJoinGame to only join if handleCheckUsername returns true
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowGameStartedDialog(false);

    if (!username || !gameId) {
      toast.error("Informazioni mancanti", {
        description: "Inserisci il tuo nome e l'ID della partita",
      });
      return;
    }

    // Check username availability first
    const isAvailable = await handleCheckUsername();
    if (!isAvailable) {
      return;
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
              "Impossibile unirsi alla partita. Controlla l'ID e riprova."
          );
          toast.error("Errore", {
            description:
              result.message ||
              "Impossibile unirsi alla partita. Controlla l'ID e riprova.",
          });
        }
      }
    } catch (err: any) {
      console.error("Error joining game:", err);
      setError(
        err.message ||
          "Impossibile unirsi alla partita. Controlla l'ID e riprova."
      );
      toast.error("Errore", {
        description:
          err.message ||
          "Impossibile unirsi alla partita. Controlla l'ID e riprova.",
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
            Torna alla Home
          </Button>
        </Link>

        <Card className="gradient-border w-full glass-card">
          <CardHeader>
            <CardTitle>Unisciti a una partita</CardTitle>
            <CardDescription>
              Inserisci un ID partita per unirti a una partita di PictionAi
              esistente
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          <form onSubmit={handleJoinGame}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameId">ID Partita</Label>
                <Input
                  id="gameId"
                  placeholder="Inserisci l'ID della partita"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  required
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Il tuo nome</Label>
                <div className="flex space-x-2">
                  <div className="grow">
                    <Input
                      id="username"
                      placeholder="Inserisci il tuo nome"
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
                        <Check className="mr-1 w-3 h-3" /> Nome disponibile
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
                    {isCheckingUsername ? "Controllo..." : "Controlla"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 pt-6">
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Accesso alla partita..."
                  : "Unisciti alla partita"}
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
            <DialogTitle>Partita già iniziata</DialogTitle>
            <DialogDescription>
              Questa partita è già{" "}
              {gameStatus === "completed" ? "terminata" : "iniziata"} e non
              accetta nuovi giocatori.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>
                Stato partita:{" "}
                {gameStatus === "completed" ? "Terminata" : "In corso"}
              </AlertTitle>
              <AlertDescription>
                {gameStatus === "completed"
                  ? "Questa partita è già terminata. Puoi vedere i risultati o creare una nuova partita."
                  : "Questa partita è attualmente in corso. Puoi guardare la partita o crearne una nuova."}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex sm:flex-row flex-col gap-2">
            <Button
              variant="glass"
              onClick={() => setShowGameStartedDialog(false)}
              className="sm:order-1"
            >
              Torna indietro
            </Button>
            <Button
              variant="gradient"
              onClick={handleViewGame}
              className="sm:order-2"
            >
              {gameStatus === "completed" ? "Vedi risultati" : "Guarda partita"}
            </Button>
            <Link href="/new-game" className="sm:order-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Crea nuova partita
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
