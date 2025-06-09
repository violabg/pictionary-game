"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getCard } from "@/lib/supabase/supabase-cards";
import {
  nextTurn,
  startTurn,
  submitGuess,
} from "@/lib/supabase/supabase-guess-and-turns";
import { selectWinner } from "@/lib/supabase/supabase-players";
import {
  Card as CardType,
  GameWithPlayers,
  Guess,
  Player,
  PlayerWithProfile,
} from "@/lib/supabase/types";
import { captureAndUploadDrawing } from "@/lib/utils/drawing-utils";
import { User } from "@supabase/supabase-js";
import { Crown, PlayCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import CardDisplay from "./card-display";
import DrawingCanvas, { DrawingCanvasRef } from "./drawing-canvas";
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
  const [turnEnded, setTurnEnded] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);

  const players = game.players;

  const currentDrawer = useMemo(
    () => players.find((p) => p.player_id === game.current_drawer_id),
    [players, game.current_drawer_id]
  );
  const currentPlayer = useMemo(
    () => players.find((p) => p.player_id === user.id),
    [players, user.id]
  );

  // Helper function to capture drawing and move to next turn
  const handleNextTurn = useCallback(
    async (params: {
      gameId: string;
      cardId: string;
      pointsAwarded: number;
      winnerId?: string | null;
      winnerProfileId?: string | null;
    }) => {
      try {
        let drawingImageUrl: string | undefined;

        // Capture drawing screenshot if we're the drawer
        if (isDrawer && drawingCanvasRef.current) {
          const canvasDataUrl = drawingCanvasRef.current.captureDrawing();
          if (canvasDataUrl) {
            const uploadedUrl = await captureAndUploadDrawing(
              params.gameId,
              canvasDataUrl
            );
            if (uploadedUrl) {
              drawingImageUrl = uploadedUrl;
            }
          }
        }

        // Move to next turn with or without drawing image
        await nextTurn({
          ...params,
          drawingImageUrl,
        });
      } catch (error) {
        console.error("Error moving to next turn:", error);
        throw error;
      }
    },
    [isDrawer] // Only depend on isDrawer, not game.id since it's passed in params
  );

  useEffect(() => {
    // Check if current player is the drawer
    setIsDrawer(game.current_drawer_id === user.id);
  }, [game.current_drawer_id, user.id]);

  // Separate effect for card fetching
  useEffect(() => {
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
  }, [game.current_drawer_id, user.id, game.current_card_id]);

  // Separate effect for timer logic
  useEffect(() => {
    // Check if turn has started based on timer_end
    setTurnStarted(!!game.timer_end);

    // Reset turn ended flag only when the game state actually changes (new turn)
    setTurnEnded(false);

    // Calculate time remaining if turn has started
    if (game.timer_end) {
      const endTime = new Date(game.timer_end).getTime();
      let timerEndedFlag = false; // Local flag to prevent multiple calls

      const updateTimer = () => {
        if (!isTimerPaused && !timerEndedFlag) {
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(diff);

          if (diff <= 0) {
            timerEndedFlag = true; // Set local flag immediately

            // Show time up modal and correct answer
            if (currentCard && currentCard.title) {
              setCorrectAnswer(currentCard.title);
            } else {
              setCorrectAnswer(null);
            }
            setShowTimeUpModal(true);

            if (isDrawer) {
              // If time's up and we're the drawer, move to next turn
              setTurnEnded(true); // Set state flag

              // Use the current card ID from game state
              if (game.current_card_id) {
                handleNextTurn({
                  gameId: game.id,
                  cardId: game.current_card_id,
                  pointsAwarded: 0,
                }).catch((error) => {
                  console.error("Error moving to next turn:", error);
                  toast.error("Error", {
                    description: "Failed to move to the next turn",
                  });
                });
              } else {
                console.error("No current card available when timer expired");
                toast.error("Error", {
                  description: "No card available to complete the turn",
                });
              }
            }

            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
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
    isDrawer,
    isTimerPaused,
    game.timer_end,
    game.id,
    game.current_card_id,
    currentCard,
    handleNextTurn,
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
                description: `${guesser.profile.user_name} guessed correctly and earned ${timeRemaining} points!`,
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
    if (!currentPlayer || turnEnded) return;

    try {
      const result = await submitGuess(
        game.id,
        currentPlayer.id,
        guess,
        timeRemaining
      );

      // If guess is correct, handle next turn with drawing capture
      if (result.isCorrect && result.currentScore !== undefined) {
        setTurnEnded(true); // Prevent multiple submissions

        if (game.current_card_id) {
          await handleNextTurn({
            gameId: game.id,
            cardId: game.current_card_id,
            pointsAwarded: result.currentScore,
            winnerId: currentPlayer.id,
            winnerProfileId: currentPlayer.player_id,
          });
        } else {
          console.error("No current card ID available for correct guess");
          toast.error("Error", {
            description: "Game state error - no card available",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
      toast.error("Error", {
        description: "Failed to submit guess",
      });
    }
  };

  const handleSelectWinner = async (winner: PlayerWithProfile) => {
    if (turnEnded) return;

    try {
      setTurnEnded(true); // Prevent multiple selections
      let drawingImageUrl: string | undefined;

      // Capture drawing screenshot if we're the drawer
      if (isDrawer && drawingCanvasRef.current) {
        const canvasDataUrl = drawingCanvasRef.current.captureDrawing();
        if (canvasDataUrl) {
          const uploadedUrl = await captureAndUploadDrawing(
            game.id,
            canvasDataUrl
          );
          if (uploadedUrl) {
            drawingImageUrl = uploadedUrl;
          }
        }
      }

      await selectWinner({
        gameId: game.id,
        cardId: currentCard?.id || "",
        winnerId: winner.id,
        winnerProfileId: winner.player_id,
        timeRemaining,
        drawingImageUrl,
      });
      setShowSelectWinnerModal(false);
      setCorrectGuessers([]);
      setIsTimerPaused(false); // Resume timer if winner is selected (timer will end anyway)
    } catch (error) {
      console.error("Error selecting winner:", error);
      setTurnEnded(false); // Reset flag on error
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
          <span className="inline-block bg-primary/20 px-3 py-1 rounded-full font-medium text-primary text-sm">
            Categoria: {game.category}
          </span>

          <span
            className={`
              inline-block ml-2 px-3 py-1 rounded-full font-medium text-sm text-black
              ${
                game.difficulty === "facile"
                  ? "bg-green-200"
                  : game.difficulty === "medio"
                  ? "bg-yellow-200"
                  : game.difficulty === "difficile"
                  ? "bg-red-200"
                  : "bg-violet-300"
              }
            `}
          >
            Difficoltà: {game.difficulty}
          </span>
          <span className="inline-block ml-2 px-3 py-1 rounded-full font-medium text-white text-sm gradient-bg">
            N° parole: {game.card_title_length}
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
                ref={drawingCanvasRef}
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

          {!isDrawer && turnStarted && game.current_card_id && (
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
          players={players.filter(
            (p) => p.player_id !== game.current_drawer_id
          )}
          onSelectWinner={handleSelectWinner}
          onClose={handleCloseSelectWinner}
          timeRemaining={timeRemaining}
        />
      )}
    </div>
  );
}
