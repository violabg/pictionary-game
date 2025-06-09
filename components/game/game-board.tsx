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

// Consolidated game state interface
interface GameState {
  currentCard: CardType | null;
  isDrawer: boolean;
  turnStarted: boolean;
  turnEnded: boolean;
  timeRemaining: number;
  isStartingTurn: boolean;
}

// Consolidated modal state interface
interface ModalState {
  showSelectWinner: boolean;
  showTimeUp: boolean;
  correctAnswer: string | null;
  isTimerPaused: boolean;
}

export default function GameBoard({ game, user }: GameBoardProps) {
  const supabase = createClient();
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Consolidated state
  const [gameState, setGameState] = useState<GameState>({
    currentCard: null,
    isDrawer: game.current_drawer_id === user.id,
    turnStarted: !!game.timer_end,
    turnEnded: false,
    timeRemaining: game.timer,
    isStartingTurn: false,
  });

  const [modalState, setModalState] = useState<ModalState>({
    showSelectWinner: false,
    showTimeUp: false,
    correctAnswer: null,
    isTimerPaused: false,
  });

  const [correctGuessers, setCorrectGuessers] = useState<Player[]>([]);

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
        if (gameState.isDrawer && drawingCanvasRef.current) {
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
    [gameState.isDrawer]
  );

  // Update game state when game changes
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      isDrawer: game.current_drawer_id === user.id,
      turnStarted: !!game.timer_end,
      turnEnded: false, // Reset on game state change
    }));
  }, [game.current_drawer_id, user.id, game.timer_end]);

  // Load card when needed
  useEffect(() => {
    const fetchCard = async (cardId: string) => {
      try {
        const newCardData = await getCard(cardId);
        setGameState((prev) => {
          // Prevent loop if getCard returns new ref for same data
          if (
            JSON.stringify(prev.currentCard) === JSON.stringify(newCardData)
          ) {
            return prev;
          }
          return { ...prev, currentCard: newCardData };
        });
      } catch (error) {
        console.error("Error fetching card:", error);
        setGameState((prev) => ({ ...prev, currentCard: null }));
      }
    };

    // Load the current card if we're the drawer
    if (gameState.isDrawer && game.current_card_id) {
      fetchCard(game.current_card_id);
    } else {
      setGameState((prev) => ({ ...prev, currentCard: null }));
    }
  }, [gameState.isDrawer, game.current_card_id]);

  // Timer logic effect
  useEffect(() => {
    if (!gameState.turnStarted || !game.timer_end) return;

    const endTime = new Date(game.timer_end).getTime();
    let timerEndedFlag = false; // Local flag to prevent multiple calls

    const updateTimer = () => {
      if (!modalState.isTimerPaused && !timerEndedFlag) {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setGameState((prev) => ({ ...prev, timeRemaining: diff }));

        if (diff <= 0) {
          timerEndedFlag = true; // Set local flag immediately

          // Show time up modal and correct answer
          setModalState((prev) => ({
            ...prev,
            showTimeUp: true,
            correctAnswer: gameState.currentCard?.title || null,
          }));

          if (gameState.isDrawer && !gameState.turnEnded) {
            // If time's up and we're the drawer, move to next turn
            setGameState((prev) => ({ ...prev, turnEnded: true }));

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
  }, [
    gameState.turnStarted,
    gameState.isDrawer,
    gameState.turnEnded,
    gameState.currentCard?.title,
    modalState.isTimerPaused,
    game.timer_end,
    game.id,
    game.current_card_id,
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
        async (payload) => {
          const guess = payload.new as Guess;

          // If we're the drawer and this is a correct guess
          if (
            gameState.isDrawer &&
            guess.is_correct &&
            !correctGuessers.some((p) => p.id === guess.player_id) &&
            !gameState.turnEnded
          ) {
            // Find the player who made the guess
            const guesser = players.find((p) => p.id === guess.player_id);
            if (guesser) {
              setCorrectGuessers((prev) => [...prev, guesser]);

              // Show toast notification
              toast.success("Correct Guess!", {
                description: `${guesser.profile.user_name} guessed correctly and earned ${gameState.timeRemaining} points!`,
              });

              // Handle next turn with drawing capture since we're the drawer
              setGameState((prev) => ({ ...prev, turnEnded: true })); // Prevent multiple next turn calls

              if (game.current_card_id) {
                try {
                  await handleNextTurn({
                    gameId: game.id,
                    cardId: game.current_card_id,
                    pointsAwarded: gameState.timeRemaining,
                    winnerId: guesser.id,
                    winnerProfileId: guesser.player_id,
                  });
                } catch (error) {
                  console.error("Error moving to next turn:", error);
                  toast.error("Error", {
                    description: "Failed to move to the next turn",
                  });
                  setGameState((prev) => ({ ...prev, turnEnded: false })); // Reset flag on error
                }
              } else {
                console.error("No current card ID available for correct guess");
                toast.error("Error", {
                  description: "Game state error - no card available",
                });
                setGameState((prev) => ({ ...prev, turnEnded: false })); // Reset flag on error
              }
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
    gameState.isDrawer,
    gameState.turnEnded,
    gameState.timeRemaining,
    players,
    correctGuessers,
    game.current_card_id,
    handleNextTurn,
  ]);

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPlayer || gameState.turnEnded) return;

    try {
      const result = await submitGuess(
        game.id,
        currentPlayer.id,
        guess,
        gameState.timeRemaining
      );

      // If guess is correct, show success message
      // The drawer will handle the next turn logic via the guess subscription
      if (result.isCorrect && result.currentScore !== undefined) {
        toast.success("Correct!", {
          description: `You guessed correctly and earned ${gameState.timeRemaining} points!`,
        });
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
      toast.error("Error", {
        description: "Failed to submit guess",
      });
    }
  };

  const handleSelectWinner = async (winner: PlayerWithProfile) => {
    if (gameState.turnEnded) return;

    try {
      setGameState((prev) => ({ ...prev, turnEnded: true })); // Prevent multiple selections
      let drawingImageUrl: string | undefined;

      // Capture drawing screenshot if we're the drawer
      if (gameState.isDrawer && drawingCanvasRef.current) {
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
        cardId: gameState.currentCard?.id || "",
        winnerId: winner.id,
        winnerProfileId: winner.player_id,
        timeRemaining: gameState.timeRemaining,
        drawingImageUrl,
      });

      setModalState((prev) => ({
        ...prev,
        showSelectWinner: false,
        isTimerPaused: false, // Resume timer if winner is selected (timer will end anyway)
      }));
      setCorrectGuessers([]);
    } catch (error) {
      console.error("Error selecting winner:", error);
      setGameState((prev) => ({ ...prev, turnEnded: false })); // Reset flag on error
      toast.error("Error", {
        description: "Failed to select winner",
      });
    }
  };

  const handleStartTurn = async () => {
    if (!gameState.isDrawer) return;

    setGameState((prev) => ({ ...prev, isStartingTurn: true }));
    try {
      await startTurn(game.id);
      setGameState((prev) => ({ ...prev, turnStarted: true }));
    } catch (error) {
      console.error("Error starting turn:", error);
      toast.error("Error", {
        description: "Failed to start turn",
      });
    } finally {
      setGameState((prev) => ({ ...prev, isStartingTurn: false }));
    }
  };

  const handleOpenSelectWinner = () => {
    if (!gameState.isDrawer || !gameState.turnStarted) return;
    setModalState((prev) => ({
      ...prev,
      showSelectWinner: true,
      isTimerPaused: true, // Pause timer when modal opens
    }));
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleCloseSelectWinner = () => {
    setModalState((prev) => ({
      ...prev,
      showSelectWinner: false,
      isTimerPaused: false, // Resume timer if modal closed without winner
    }));
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
        {gameState.turnStarted ? (
          <div className="flex items-center gap-4">
            <Timer seconds={gameState.timeRemaining} />
          </div>
        ) : (
          <div className="font-medium text-muted-foreground text-lg">
            {gameState.isDrawer
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
                isDrawer={gameState.isDrawer}
                currentDrawer={currentDrawer}
                turnStarted={gameState.turnStarted}
              />
            )}

            {gameState.isDrawer && !gameState.turnStarted && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleStartTurn}
                  disabled={gameState.isStartingTurn}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  {gameState.isStartingTurn
                    ? "Avvio turno..."
                    : "Inizia il tuo turno"}
                </Button>
              </div>
            )}
          </div>

          {!gameState.isDrawer &&
            gameState.turnStarted &&
            game.current_card_id && (
              <div className="mt-4">
                <GuessInput
                  onSubmit={handleGuessSubmit}
                  disabled={gameState.isDrawer}
                />
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
          {modalState.showTimeUp && gameState.timeRemaining === 0 && (
            <Card className="gradient-border glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-red-500 text-lg">
                  Tempo scaduto!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-2">La risposta corretta era:</p>
                <div className="mb-4 font-semibold text-xl">
                  {modalState.correctAnswer || ""}
                </div>
              </CardContent>
            </Card>
          )}
          {gameState.isDrawer && (
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
          {gameState.isDrawer && gameState.currentCard && (
            <CardDisplay card={gameState.currentCard} />
          )}
        </div>
      </div>

      {modalState.showSelectWinner && (
        <SelectWinnerModal
          players={players.filter(
            (p) => p.player_id !== game.current_drawer_id
          )}
          onSelectWinner={handleSelectWinner}
          onClose={handleCloseSelectWinner}
          timeRemaining={gameState.timeRemaining}
        />
      )}
    </div>
  );
}
