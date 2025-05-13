"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getCard } from "@/lib/supabase/supabase-cards";
import { selectWinner } from "@/lib/supabase/supabase-game-players";
import {
  nextTurn,
  startTurn,
  submitGuess,
} from "@/lib/supabase/supabase-guess-and-turns";
import {
  Card as CardType,
  GameWithPlayers,
  Guess,
  Player,
} from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { Crown, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import CardDisplay from "./card-display";
import DrawingCanvas from "./drawing-canvas";
import GuessInput from "./guess-input";
import PlayerList from "./player-list";
import SelectWinnerModal from "./select-winner-modal";
import Timer from "./timer";

interface GameBoardProps {
  game: GameWithPlayers;
  user: User;
}

export default function GameBoard({ game, user }: GameBoardProps) {
  const supabase = createClient();
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [correctGuessers, setCorrectGuessers] = useState<Player[]>([]);
  const [showSelectWinnerModal, setShowSelectWinnerModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(game.timer);
  const [turnStarted, setTurnStarted] = useState(false);
  const [isStartingTurn, setIsStartingTurn] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const players = game.players;

  const currentDrawer = useMemo(
    () => players.find((p) => p.player_id === game.current_drawer_id),
    [players, game.current_drawer_id]
  );
  const currentPlayer = useMemo(
    () => players.find((p) => p.player_id === user.id),
    [players, user.id]
  );

  useEffect(() => {
    // Check if current player is the drawer
    setIsDrawer(game.current_drawer_id === user.id);

    const fetchCard = async (cardId: string) => {
      try {
        const newCardData = await getCard(cardId);

        setCurrentCard((prevCard) => {
          // Prevent loop if getCard returns new ref for same data
          if (JSON.stringify(prevCard) === JSON.stringify(newCardData)) {
            return prevCard;
          }
          return newCardData;
        });
      } catch (error) {
        console.error("Error fetching card:", error);
        setCurrentCard(null);
      }
    };
    // Load the current card if we're the drawer
    if (game.current_drawer_id === user.id && game.current_card_id) {
      fetchCard(game.current_card_id);
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
            if (currentCard && currentCard.title) {
              setCorrectAnswer(currentCard.title);
            } else {
              // Avoid fetching card inside timer; rely on currentCard state
              setCorrectAnswer(null); // Or a placeholder like "N/A"
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
  }, [
    user.id,
    isDrawer,
    isTimerPaused,
    currentCard,
    game.current_drawer_id,
    game.current_card_id,
    game.timer_end,
    game.id,
  ]);

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
          const guess = payload.new as Guess;

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
  }, [game.id, supabase, isDrawer, players, correctGuessers, timeRemaining]);

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
    <div className="flex flex-col py-0 min-h-screen container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-between items-center gap-2">
          Categoria:
          <span className="inline-block bg-primary/10 px-3 py-1 rounded-full font-medium text-primary text-sm">
            {game.category}
          </span>
          Difficoltà:
          <span className="inline-block bg-secondary ml-2 px-3 py-1 rounded-full font-medium text-secondary-foreground text-sm">
            {game.difficulty}
          </span>
        </div>
        {turnStarted ? (
          <div className="flex items-center gap-4">
            <Timer seconds={timeRemaining} />
          </div>
        ) : (
          <div className="font-medium text-muted-foreground text-lg">
            {isDrawer
              ? "È il tuo turno di disegnare"
              : `In attesa che ${currentDrawer?.profile.name} inizi`}
          </div>
        )}
      </div>

      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        <div className="flex flex-col lg:col-span-3">
          <div className="p-4 gradient-border rounded-lg glass-card grow">
            {currentDrawer && (
              <DrawingCanvas
                gameId={game.id}
                isDrawer={isDrawer}
                currentDrawer={currentDrawer}
                turnStarted={turnStarted}
              />
            )}

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
                  {isStartingTurn ? "Avvio turno..." : "Inizia il tuo turno"}
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
          {/* Show time's up card above the player list */}
          {showTimeUpModal && timeRemaining === 0 && (
            <Card className="gradient-border glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-red-500 text-lg">
                  Tempo scaduto!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-2">La risposta corretta era:</p>
                <div className="mb-4 font-semibold text-xl">
                  {correctAnswer || ""}
                </div>
              </CardContent>
            </Card>
          )}
          {isDrawer && (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleOpenSelectWinner}
              className="flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Seleziona Vincitore
            </Button>
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
    </div>
  );
}
