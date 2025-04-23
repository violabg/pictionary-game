"use client";

import {
  getCard,
  nextTurn,
  selectWinner,
  startTurn,
  submitGuess,
} from "@/lib/game-actions";
import type { Card, Game, Player } from "@/lib/types";
import { Crown, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CardDisplay from "./card-display";
import DrawingCanvas from "./drawing-canvas";
import GuessInput from "./guess-input";
import PlayerList from "./player-list";
import SelectWinnerModal from "./select-winner-modal";
import { useSupabase } from "./supabase-provider";
import Timer from "./timer";
import { Button } from "./ui/button";

interface GameBoardProps {
  game: Game;
  players: Player[];
}

export default function GameBoard({ game, players }: GameBoardProps) {
  const { supabase } = useSupabase();
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [correctGuessers, setCorrectGuessers] = useState<Player[]>([]);
  const [showSelectWinnerModal, setShowSelectWinnerModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [turnStarted, setTurnStarted] = useState(false);
  const [isStartingTurn, setIsStartingTurn] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playerId = localStorage.getItem("playerId");
  const currentPlayer = players.find((p) => p.id === playerId);

  useEffect(() => {
    // Check if current player is the drawer
    setIsDrawer(game.current_drawer_id === playerId);

    // Load the current card if we're the drawer
    if (game.current_drawer_id === playerId && game.current_card_id) {
      getCard(game.current_card_id).then(setCurrentCard);
    } else {
      setCurrentCard(null);
    }

    // Check if turn has started based on timer_end
    setTurnStarted(!!game.timer_end);

    // Calculate time remaining if turn has started
    if (game.timer_end) {
      const endTime = new Date(game.timer_end).getTime();
      const updateTimer = () => {
        if (!isTimerPaused) {
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(diff);

          if (diff <= 0) {
            // Show time up modal and correct answer
            if (currentCard) {
              setCorrectAnswer(currentCard.title);
            } else if (game.current_card_id) {
              getCard(game.current_card_id).then((card) => {
                setCorrectAnswer(card.title);
              });
            }
            setShowTimeUpModal(true);
          }

          if (diff <= 0 && isDrawer) {
            // If time's up and we're the drawer, move to next turn
            nextTurn(game.id).catch((error) => {
              console.error("Error moving to next turn:", error);
              toast.error("Error", {
                description: "Failed to move to the next turn",
              });
            });
            if (timerIntervalRef.current)
              clearInterval(timerIntervalRef.current);
          }
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [game, playerId, isDrawer, isTimerPaused]);

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
          const guess = payload.new as any;

          // If we're the drawer and this is a correct guess
          if (
            isDrawer &&
            guess.is_correct &&
            !correctGuessers.some((p) => p.id === guess.player_id)
          ) {
            // Find the player who made the guess
            const guesser = players.find((p) => p.id === guess.player_id);
            if (guesser) {
              setCorrectGuessers((prev) => [...prev, guesser]);

              // Show toast notification
              toast.success("Correct Guess!", {
                description: `${guesser.username} guessed correctly and earned ${timeRemaining} points!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(guessSubscription);
    };
  }, [
    game.id,
    supabase,
    isDrawer,
    players,
    correctGuessers,
    toast,
    timeRemaining,
  ]);

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPlayer) return;

    try {
      await submitGuess(game.id, currentPlayer.id, guess, timeRemaining);
    } catch (error) {
      console.error("Error submitting guess:", error);
      toast.error("Error", {
        description: "Failed to submit guess",
      });
    }
  };

  const handleSelectWinner = async (winnerId: string) => {
    try {
      await selectWinner(game.id, winnerId, timeRemaining);
      setShowSelectWinnerModal(false);
      setCorrectGuessers([]);
      setIsTimerPaused(false); // Resume timer if winner is selected (timer will end anyway)
    } catch (error) {
      console.error("Error selecting winner:", error);
      toast.error("Error", {
        description: "Failed to select winner",
      });
    }
  };

  const handleStartTurn = async () => {
    if (!isDrawer) return;

    setIsStartingTurn(true);
    try {
      await startTurn(game.id);
      setTurnStarted(true);
    } catch (error) {
      console.error("Error starting turn:", error);
      toast.error("Error", {
        description: "Failed to start turn",
      });
    } finally {
      setIsStartingTurn(false);
    }
  };

  const handleOpenSelectWinner = () => {
    if (!isDrawer || !turnStarted) return;
    setShowSelectWinnerModal(true);
    setIsTimerPaused(true); // Pause timer when modal opens
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleCloseSelectWinner = () => {
    setShowSelectWinnerModal(false);
    setIsTimerPaused(false); // Resume timer if modal closed without winner
  };

  return (
    <div className="flex flex-col py-6 min-h-screen container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl gradient-text">
          Pictionary: {game.category}
        </h1>
        {turnStarted ? (
          <div className="flex items-center gap-4">
            <Timer seconds={timeRemaining} />
            {isDrawer && (
              <Button
                variant="gradient"
                size="sm"
                onClick={handleOpenSelectWinner}
                className="flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Select Winner
              </Button>
            )}
          </div>
        ) : (
          <div className="font-medium text-muted-foreground text-lg">
            {isDrawer ? "Your turn to draw" : "Waiting for drawer to start"}
          </div>
        )}
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-4 grow">
        <div className="flex flex-col md:col-span-3">
          <div className="p-4 gradient-border rounded-lg glass-card grow">
            <DrawingCanvas
              gameId={game.id}
              isDrawer={isDrawer}
              currentDrawerId={game.current_drawer_id}
              turnStarted={turnStarted}
            />

            {isDrawer && !turnStarted && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleStartTurn}
                  disabled={isStartingTurn}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
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
          {game.current_drawer_id && (
            <PlayerList
              players={players}
              currentDrawerId={game.current_drawer_id}
            />
          )}

          {isDrawer && currentCard && <CardDisplay card={currentCard} />}
        </div>
      </div>

      {showSelectWinnerModal && (
        <SelectWinnerModal
          players={players.filter((p) => p.id !== game.current_drawer_id)}
          onSelectWinner={handleSelectWinner}
          onClose={handleCloseSelectWinner}
          timeRemaining={timeRemaining}
        />
      )}

      {/* Modal for time's up */}
      {showTimeUpModal && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white shadow-lg p-8 rounded-lg w-full max-w-sm text-center">
            <h2 className="mb-4 font-bold text-2xl">Tempo scaduto!</h2>
            <p className="mb-4">La risposta corretta era:</p>
            <div className="mb-6 font-semibold text-xl">
              {correctAnswer || ""}
            </div>
            <Button
              variant="gradient"
              onClick={() => setShowTimeUpModal(false)}
            >
              Chiudi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
