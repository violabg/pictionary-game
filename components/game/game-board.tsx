"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedUser } from "@/hooks/useAuth";
import { useAction, useMutation, useQuery } from "convex/react";
import { Crown, PlayCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import CardDisplay from "./card-display";
import DrawingCanvas, { DrawingCanvasRef } from "./drawing-canvas";
import GuessFeed from "./guess-feed";
import GuessInput from "./guess-input";
import PlayerList from "./player-list";
import ScoreLegend from "./score-legend";
import SelectWinnerModal from "./select-winner-modal";
import Timer from "./timer";
import TurnWinnerBanner from "./turn-winner-banner";

interface GameBoardProps {
  gameId: Id<"games">;
  code: string;
}

// Consolidated game state interface
interface GameState {
  currentCard: {
    _id: Id<"cards">;
    word: string;
    description: string;
    category: string;
  } | null;
  isDrawer: boolean;
  turnStarted: boolean;
  turnEnded: boolean;
  timeRemaining: number;
  isStartingTurn: boolean;
  currentTurnId: Id<"turns"> | null;
}

// Consolidated modal state interface
interface ModalState {
  showSelectWinner: boolean;
  showTimeUp: boolean;
  correctAnswer: string | null;
  isTimerPaused: boolean;
  showWinnerBanner: boolean;
  winnerBannerData: {
    username: string;
    points: number;
  } | null;
}

export default function GameBoard({ gameId, code }: GameBoardProps) {
  const { profile } = useAuthenticatedUser();
  const game = useQuery(api.queries.games.getGame, { game_id: gameId });
  const players = useQuery(api.queries.players.getGamePlayers, {
    game_id: gameId,
  });
  const currentTurn = useQuery(api.queries.turns.getCurrentTurn, {
    game_id: gameId,
  });
  const currentCard = useQuery(
    api.queries.cards.getCurrentCard,
    currentTurn?.card_id ? { game_id: gameId } : "skip"
  );

  // Watch for guesses on current turn (for drawer to detect correct guesses)
  const turnGuesses = useQuery(
    api.queries.guesses.getTurnGuesses,
    currentTurn?._id ? { turn_id: currentTurn._id } : "skip"
  );

  // Mutations and Actions
  const startNewTurnMutation = useMutation(api.mutations.game.startNewTurn);
  const submitGuessAndCompleteTurnMutation = useMutation(
    api.mutations.game.submitGuessAndCompleteTurn
  );
  const completeGameTurnMutation = useMutation(
    api.mutations.game.completeGameTurn
  );
  const finalizeTurnCompletionMutation = useMutation(
    api.mutations.game.finalizeTurnCompletion
  );
  const setTurnStartTimeMutation = useMutation(
    api.mutations.game.setTurnStartTime
  );
  const uploadDrawingAction = useAction(
    api.actions.uploadDrawing.uploadDrawingScreenshot
  );

  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartTimeSetRef = useRef<boolean>(false); // Track if we've set turn start time

  // Consolidated state
  const [gameState, setGameState] = useState<GameState>({
    currentCard: null,
    isDrawer: game?.current_drawer_id === profile?.user_id,
    turnStarted: currentTurn?.status === "drawing",
    turnEnded: false,
    timeRemaining: 60, // Default, will be updated by timer
    isStartingTurn: false,
    currentTurnId: currentTurn?._id ?? null,
  });

  const [modalState, setModalState] = useState<ModalState>({
    showSelectWinner: false,
    showTimeUp: false,
    correctAnswer: null,
    isTimerPaused: false,
    showWinnerBanner: false,
    winnerBannerData: null,
  });

  // Phase 3: Performance optimizations with useMemo for expensive computations
  const currentDrawer = useMemo(
    () => players?.find((p) => p.player_id === game?.current_drawer_id),
    [players, game?.current_drawer_id]
  );

  const currentPlayer = useMemo(
    () => players?.find((p) => p.player_id === profile?.user_id),
    [players, profile?.user_id]
  );

  // Memoize sorted players for performance
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Helper function to capture and upload drawing with retry logic
  // ONLY called by the drawer
  const captureAndUploadDrawingWithRetry = useCallback(
    async (maxRetries = 3): Promise<Id<"_storage"> | null> => {
      if (!gameState.isDrawer || !drawingCanvasRef.current || !currentTurn) {
        return null;
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const canvasDataUrl = drawingCanvasRef.current.captureDrawing();
          if (!canvasDataUrl) {
            console.warn("No canvas data to capture");
            return null;
          }

          // Convert data URL to blob
          const response = await fetch(canvasDataUrl);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();

          // Upload to storage and save to database atomically
          const storageId = await uploadDrawingAction({
            gameId,
            turnId: currentTurn._id,
            pngBlob: buffer,
          });

          toast.success("Disegno salvato!");
          return storageId;
        } catch (error) {
          console.error(
            `Drawing upload attempt ${attempt}/${maxRetries} failed:`,
            error
          );

          if (attempt === maxRetries) {
            toast.error("Errore salvataggio disegno", {
              description: "Non è stato possibile salvare il disegno. Riprova.",
            });
            return null;
          }

          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 500)
          );
        }
      }

      return null;
    },
    [gameState.isDrawer, currentTurn, gameId, uploadDrawingAction]
  );

  // Handle time up scenario - ONLY for drawer
  const handleTimeUp = useCallback(async () => {
    if (!gameState.isDrawer || gameState.turnEnded || !currentTurn) return;

    setGameState((prev) => ({ ...prev, turnEnded: true }));

    try {
      // CRITICAL: Drawer must capture and upload drawing BEFORE completing turn
      toast.info("Salvando il disegno...");
      const drawingStorageId = await captureAndUploadDrawingWithRetry();

      if (!drawingStorageId) {
        console.warn("Failed to upload drawing, completing turn anyway");
      }

      // Drawing is already saved via uploadDrawing action
      await completeGameTurnMutation({
        game_id: gameId,
        turn_id: currentTurn._id,
        reason: "time_up",
      });

      toast.success("Tempo scaduto!", {
        description: "Il turno è terminato.",
      });
    } catch (error) {
      console.error("Error completing time up turn:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossibile completare il turno";
      toast.error("Errore", {
        description: errorMessage,
        duration: 5000,
      });
      setGameState((prev) => ({ ...prev, turnEnded: false }));
    }
  }, [
    gameState.isDrawer,
    gameState.turnEnded,
    currentTurn,
    gameId,
    captureAndUploadDrawingWithRetry,
    completeGameTurnMutation,
  ]);

  // Update game state when game changes
  useEffect(() => {
    if (game && profile) {
      setGameState((prev) => ({
        ...prev,
        isDrawer: game.current_drawer_id === profile.user_id,
        turnStarted: currentTurn?.status === "drawing",
        turnEnded: false,
        currentTurnId: currentTurn?._id ?? null,
      }));
    }
  }, [game, profile, currentTurn?.status, currentTurn?._id]);

  // Update current card
  // Reset turn start time ref when a new turn begins (draw-to-start timer)
  useEffect(() => {
    if (currentTurn?._id) {
      turnStartTimeSetRef.current = false;
    }
  }, [currentTurn?._id]);

  useEffect(() => {
    if (currentCard && gameState.isDrawer) {
      setGameState((prev) => ({ ...prev, currentCard }));
    } else {
      setGameState((prev) => ({ ...prev, currentCard: null }));
    }
  }, [currentCard, gameState.isDrawer]);

  // Timer logic effect - handles draw-to-start timer
  useEffect(() => {
    if (!gameState.turnStarted || !currentTurn) return;

    // If turn hasn't started yet (no first stroke drawn), show waiting message
    if (!currentTurn.started_at) {
      setGameState((prev) => ({ ...prev, timeRemaining: 60 }));
      return;
    }

    const startTime = currentTurn.started_at;
    const timeLimit = currentTurn.time_limit;
    const endTime = startTime + timeLimit * 1000;
    let timerEndedFlag = false;

    const updateTimer = () => {
      if (!modalState.isTimerPaused && !timerEndedFlag) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setGameState((prev) => ({ ...prev, timeRemaining: diff }));

        if (diff <= 0) {
          timerEndedFlag = true;

          // Show time up modal
          setModalState((prev) => ({
            ...prev,
            showTimeUp: true,
            correctAnswer: gameState.currentCard?.word || null,
          }));

          // Handle time up
          handleTimeUp();

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
    gameState.currentCard?.word,
    modalState.isTimerPaused,
    currentTurn,
    handleTimeUp,
  ]);

  // Watch for turn status changing to "completing" - drawer captures drawing after correct guess
  useEffect(() => {
    if (!gameState.isDrawer || gameState.turnEnded || !currentTurn) return;

    // Check if turn status changed to "completing" (correct guess submitted)
    if (currentTurn.status === "completing") {
      // Drawer needs to capture and upload the drawing before finalizing
      const drawerCapture = async () => {
        try {
          toast.info("Disegno indovinato! Salvataggio...");
          const drawingStorageId = await captureAndUploadDrawingWithRetry();

          if (!drawingStorageId) {
            console.warn(
              "Failed to upload drawing for correct guess, finalizing anyway"
            );
          }

          // Now finalize the turn completion
          await finalizeTurnCompletionMutation({
            game_id: gameId,
            turn_id: currentTurn._id,
          });

          toast.success("Turno completato!");
        } catch (error) {
          console.error("Error in drawer capture for correct guess:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Impossibile completare il turno";
          toast.error("Errore", {
            description: errorMessage,
            duration: 5000,
          });
        }
      };

      drawerCapture();
    }
  }, [
    gameState.isDrawer,
    gameState.turnEnded,
    currentTurn,
    gameId,
    captureAndUploadDrawingWithRetry,
    finalizeTurnCompletionMutation,
  ]);

  // Watch for turn completion and show winner banner
  useEffect(() => {
    if (!currentTurn) return;

    // Show winner banner when turn is completed
    if (
      (currentTurn.status === "completed" ||
        currentTurn.status === "time_up") &&
      currentTurn.winner_id
    ) {
      const winner = players?.find(
        (p) => p.player_id === currentTurn.winner_id
      );
      if (winner && currentTurn.points_awarded !== undefined) {
        setModalState((prev) => ({
          ...prev,
          showWinnerBanner: true,
          winnerBannerData: {
            username: winner.username,
            points: currentTurn.points_awarded || 0,
          },
          correctAnswer: currentCard?.word || null,
        }));
      }
    }

    // Hide banner on next turn
    if (currentTurn.status === "drawing") {
      setModalState((prev) => ({
        ...prev,
        showWinnerBanner: false,
        winnerBannerData: null,
      }));
    }
  }, [currentTurn, players, currentCard]);

  // Check loading states - after all hooks
  if (!game || !players || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPlayer || gameState.turnEnded || !currentTurn) return;

    // If this is the drawer guessing (shouldn't happen but safety check)
    if (gameState.isDrawer) {
      toast.error("Non puoi indovinare", {
        description: "Sei il disegnatore!",
      });
      return;
    }

    try {
      // Note: Drawing capture and upload happens client-side via real-time subscription
      // when a correct guess is detected, the drawer's client will be notified
      // via turn status changing to "completing" (handled in useEffect above)

      const result = await submitGuessAndCompleteTurnMutation({
        game_id: gameId,
        turn_id: currentTurn._id,
        guess_text: guess,
        // Drawing upload handled separately by drawer's client
      });

      if (!result.is_correct) {
        toast.error("Risposta errata", {
          description: "Riprova con un'altra risposta!",
        });
        return;
      }

      // Correct guess - turn will be completed by drawer's client
      toast.success("Corretto!", {
        description: `Hai indovinato e guadagnato punti!`,
      });
    } catch (error) {
      console.error("Error in guess submission:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossibile inviare il tuo indovino";
      toast.error("Errore", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleSelectWinner = async (winner: Doc<"players">) => {
    if (gameState.turnEnded || !currentTurn || !gameState.isDrawer) return;

    try {
      setGameState((prev) => ({ ...prev, turnEnded: true }));

      // CRITICAL: Drawer must capture and upload drawing BEFORE completing turn
      toast.info("Salvando il disegno...");
      const drawingStorageId = await captureAndUploadDrawingWithRetry();

      if (!drawingStorageId) {
        console.warn("Failed to upload drawing, completing turn anyway");
      }

      // Drawing is already saved via uploadDrawing action
      await completeGameTurnMutation({
        game_id: gameId,
        turn_id: currentTurn._id,
        reason: "manual",
        winner_id: winner.player_id,
        points_awarded: Math.max(0, Math.floor(gameState.timeRemaining)),
      });

      toast.success("Vincitore selezionato!", {
        description: `${winner.username} è stato selezionato come vincitore!`,
      });

      setModalState((prev) => ({
        ...prev,
        showSelectWinner: false,
        isTimerPaused: false,
      }));
    } catch (error) {
      console.error("Error selecting winner:", error);
      setGameState((prev) => ({ ...prev, turnEnded: false }));
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossibile selezionare il vincitore";
      toast.error("Errore", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleStartTurn = async () => {
    if (!gameState.isDrawer) return;

    setGameState((prev) => ({ ...prev, isStartingTurn: true }));
    try {
      await startNewTurnMutation({ game_id: gameId });
      setGameState((prev) => ({ ...prev, turnStarted: true }));
    } catch (error) {
      console.error("Error starting turn:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Impossibile avviare il turno";
      toast.error("Errore", {
        description: errorMessage,
        duration: 5000,
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
      isTimerPaused: true,
    }));
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleCloseSelectWinner = () => {
    setModalState((prev) => ({
      ...prev,
      showSelectWinner: false,
      isTimerPaused: false,
    }));
  };

  return (
    <div className="flex flex-col py-0 min-h-screen container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-between items-center gap-2">
          <span className="inline-block bg-primary/20 px-3 py-1 rounded-full font-medium text-primary text-sm">
            Categoria: {game.category}
          </span>
          <span className="inline-block ml-2 px-3 py-1 rounded-full font-medium text-white text-sm gradient-bg">
            Turno: {game.round} / {game.max_rounds}
          </span>
        </div>
        {gameState.turnStarted ? (
          <div className="flex items-center gap-4">
            <Timer
              seconds={gameState.timeRemaining}
              totalTime={60}
              isWaiting={!!currentTurn && !currentTurn.started_at}
            />
          </div>
        ) : (
          <div className="font-medium text-muted-foreground text-lg">
            {gameState.isDrawer
              ? "È il tuo turno di disegnare"
              : currentDrawer
              ? `In attesa che ${currentDrawer.username} inizi`
              : "In attesa..."}
          </div>
        )}
      </div>

      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        <div className="flex flex-col lg:col-span-3">
          <div className="p-4 gradient-border rounded-lg glass-card grow">
            {currentDrawer && (
              <DrawingCanvas
                ref={drawingCanvasRef}
                gameId={gameId}
                isDrawer={gameState.isDrawer}
                currentDrawer={currentDrawer}
                turnStarted={gameState.turnStarted}
                turnId={gameState.currentTurnId}
                onFirstStroke={async () => {
                  // Call mutation to set turn start time on first stroke
                  if (
                    !turnStartTimeSetRef.current &&
                    currentTurn &&
                    !currentTurn.started_at
                  ) {
                    turnStartTimeSetRef.current = true;
                    try {
                      await setTurnStartTimeMutation({
                        game_id: gameId,
                        turn_id: currentTurn._id,
                      });
                    } catch (error) {
                      console.error("Failed to set turn start time:", error);
                      turnStartTimeSetRef.current = false;
                    }
                  }
                }}
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
            gameState.currentTurnId && (
              <div className="mt-4">
                <GuessInput
                  onSubmit={handleGuessSubmit}
                  disabled={gameState.isDrawer}
                />
              </div>
            )}

          {/* Guess Feed - Show all guesses in real-time */}
          {gameState.turnStarted && turnGuesses && turnGuesses.length > 0 && (
            <div className="mt-4">
              <GuessFeed
                guesses={turnGuesses}
                players={players}
                showAllGuesses={true}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          {game.current_drawer_id && (
            <PlayerList
              players={sortedPlayers}
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
          {/* Score Legend */}
          <ScoreLegend />
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

      <TurnWinnerBanner
        show={modalState.showWinnerBanner}
        winner={modalState.winnerBannerData}
        correctAnswer={modalState.correctAnswer}
        onComplete={() => {
          setModalState((prev) => ({
            ...prev,
            showWinnerBanner: false,
            winnerBannerData: null,
          }));
        }}
      />
    </div>
  );
}
