"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedUser } from "@/hooks/useAuth";
import { useDrawerTurnActions } from "@/hooks/useDrawerTurnActions";
import { useTurnTimer } from "@/hooks/useTurnTimer";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import DrawingCanvas, { DrawingCanvasRef } from "./drawing-canvas";
import { GameHeader } from "./game-header";
import { GuessSection } from "./guess-section";
import { RightSidebar } from "./right-sidebar";
import SelectWinnerModal from "./select-winner-modal";

interface GameBoardProps {
  gameId: Id<"games">;
  code: string;
}

// UI-only state (not derived from queries)
interface UIState {
  isStartingTurn: boolean;
  isCompletingTurn: boolean;
}

// Modal state interface
interface ModalState {
  showSelectWinner: boolean;
  showTimeUp: boolean;
  correctAnswer: string | null;
  isTimerPaused: boolean;
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
  const currentCardQuery = useQuery(
    api.queries.cards.getCurrentCard,
    currentTurn?.card_id ? { game_id: gameId } : "skip"
  );

  // Watch for guesses on current turn
  const turnGuesses = useQuery(
    api.queries.guesses.getTurnGuesses,
    currentTurn?._id ? { turn_id: currentTurn._id } : "skip"
  );

  // Mutations and Actions
  const submitGuessAndCompleteTurnMutation = useMutation(
    api.mutations.game.submitGuessAndCompleteTurn
  );
  const finalizeTurnCompletionMutation = useMutation(
    api.mutations.game.finalizeTurnCompletion
  );
  const validateGuessAction = useAction(
    api.actions.validateGuess.validateGuess
  );

  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);

  // Derive state from queries (single source of truth)
  const isDrawer = game?.current_drawer_id === profile?.user_id;
  const turnStarted = currentTurn?.status === "drawing";
  const currentCard = isDrawer ? currentCardQuery : null;

  // UI-only state
  const [uiState, setUIState] = useState<UIState>({
    isStartingTurn: false,
    isCompletingTurn: false,
  });

  const [modalState, setModalState] = useState<ModalState>({
    showSelectWinner: false,
    showTimeUp: false,
    correctAnswer: null,
    isTimerPaused: false,
    winnerBannerData: null,
  });

  // Memoized derived values
  const currentDrawer = useMemo(
    () => players?.find((p) => p.player_id === game?.current_drawer_id),
    [players, game?.current_drawer_id]
  );

  const currentPlayer = useMemo(
    () => players?.find((p) => p.player_id === profile?.user_id),
    [players, profile?.user_id]
  );

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Drawer-specific action handlers
  const drawerActions = useDrawerTurnActions({
    gameId,
    currentTurn,
    isDrawer: isDrawer ?? false,
    drawingCanvasRef,
  });

  // Timer hook
  const timeRemaining = useTurnTimer({
    currentTurn,
    isPaused: modalState.isTimerPaused,
    onTimeUp: drawerActions.handleTimeUp,
  });

  // Show time up modal when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && turnStarted) {
      setModalState((prev) => ({
        ...prev,
        showTimeUp: true,
        correctAnswer: currentCard?.word || null,
      }));
    }
  }, [timeRemaining, turnStarted, currentCard?.word]);

  // Watch for turn status changing to "completing" - drawer finalizes after correct guess
  useEffect(() => {
    if (!isDrawer || uiState.isCompletingTurn || !currentTurn) return;

    if (currentTurn.status === "completing") {
      setUIState((prev) => ({ ...prev, isCompletingTurn: true }));

      const drawerFinalize = async () => {
        try {
          toast.info("Disegno indovinato! Salvataggio...");
          const drawingStorageId =
            await drawerActions.captureAndUploadDrawing();

          if (!drawingStorageId) {
            console.warn("Failed to upload drawing, finalizing anyway");
          }

          await finalizeTurnCompletionMutation({
            game_id: gameId,
            turn_id: currentTurn._id,
          });

          toast.success("Turno completato!");
        } catch (error) {
          console.error("Error finalizing turn:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Impossibile completare il turno";
          toast.error("Errore", {
            description: errorMessage,
            duration: 5000,
          });
        } finally {
          setUIState((prev) => ({ ...prev, isCompletingTurn: false }));
        }
      };

      drawerFinalize();
    }
  }, [
    isDrawer,
    uiState.isCompletingTurn,
    currentTurn,
    gameId,
    drawerActions,
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
          winnerBannerData: {
            username: winner.username,
            points: currentTurn.points_awarded || 0,
          },
          correctAnswer: currentCardQuery?.word || null,
        }));
      }
    }

    // Hide banner on next turn
    if (currentTurn.status === "drawing") {
      setModalState((prev) => ({
        ...prev,
        winnerBannerData: null,
        correctAnswer: null,
      }));
    }
  }, [currentTurn, players, currentCardQuery]);

  // Handler callbacks - must be defined before early return
  const handleGuessSubmit = useCallback(
    async (guess: string) => {
      if (!currentPlayer || uiState.isCompletingTurn || !currentTurn) return;

      // If this is the drawer guessing (shouldn't happen but safety check)
      if (isDrawer) {
        toast.error("Non puoi indovinare", {
          description: "Sei il disegnatore!",
        });
        return;
      }

      try {
        // Use currentCardQuery (available to all players for validation)
        const correctAnswer = currentCardQuery?.word;
        let isValidGuess = false;

        // Check for exact match (case-insensitive)
        const isExactMatch =
          guess.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();

        if (isExactMatch) {
          isValidGuess = true;
        } else if (correctAnswer && game?.category) {
          // Use AI validation action for non-exact matches
          const validationResult = await validateGuessAction({
            guess,
            correctAnswer,
            category: game.category,
          });
          isValidGuess = validationResult.isCorrect;
        }

        // Submit the guess to the backend
        const result = await submitGuessAndCompleteTurnMutation({
          game_id: gameId,
          turn_id: currentTurn._id,
          guess_text: guess,
          isValidated: isValidGuess,
        });

        if (!result.is_correct && !result.is_fuzzy_match) {
          toast.error("Risposta errata", {
            description: "Riprova con un'altra risposta!",
          });
          return;
        }

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
    },
    [
      currentPlayer,
      uiState.isCompletingTurn,
      isDrawer,
      currentTurn,
      currentCardQuery?.word,
      game?.category,
      gameId,
      validateGuessAction,
      submitGuessAndCompleteTurnMutation,
    ]
  );

  const handleSelectWinner = useCallback(
    async (winner: Doc<"players">) => {
      if (!currentTurn || !isDrawer) return;

      await drawerActions.handleSelectWinner(winner, timeRemaining);

      setModalState((prev) => ({
        ...prev,
        showSelectWinner: false,
        isTimerPaused: false,
      }));
    },
    [currentTurn, isDrawer, drawerActions, timeRemaining]
  );

  const handleOpenSelectWinner = useCallback(() => {
    if (!isDrawer || !turnStarted) return;
    setModalState((prev) => ({
      ...prev,
      showSelectWinner: true,
      isTimerPaused: true,
    }));
  }, [isDrawer, turnStarted]);

  const handleCloseSelectWinner = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      showSelectWinner: false,
      isTimerPaused: false,
    }));
  }, []);

  const handleFirstStroke = useCallback(async () => {
    if (!currentTurn || currentTurn.started_at) return;

    try {
      await drawerActions.handleFirstStroke();
    } catch (error) {
      console.error("Failed to set turn start time:", error);
    }
  }, [currentTurn, drawerActions]);

  // Check loading states - after all hooks
  if (!game || !players || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-0 min-h-screen container">
      <GameHeader
        game={game}
        currentTurn={currentTurn}
        timeRemaining={timeRemaining}
        turnStarted={turnStarted}
        isDrawer={isDrawer}
        currentDrawer={currentDrawer}
      />

      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        <div className="flex flex-col lg:col-span-3">
          <div className="p-4 gradient-border rounded-lg glass-card grow">
            {currentDrawer && (
              <DrawingCanvas
                ref={drawingCanvasRef}
                gameId={gameId}
                isDrawer={isDrawer}
                currentDrawer={currentDrawer}
                turnStarted={turnStarted}
                turnId={currentTurn?._id ?? null}
                onFirstStroke={handleFirstStroke}
              />
            )}

            {isDrawer && !turnStarted && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={drawerActions.handleStartTurn}
                  disabled={uiState.isStartingTurn}
                  className="flex items-center gap-2"
                >
                  {uiState.isStartingTurn
                    ? "Avvio turno..."
                    : "Inizia il tuo turno"}
                </Button>
              </div>
            )}
          </div>

          <GuessSection
            isDrawer={isDrawer}
            turnStarted={turnStarted}
            currentTurn={currentTurn}
            turnGuesses={turnGuesses}
            players={players}
            onGuessSubmit={handleGuessSubmit}
          />
        </div>

        <RightSidebar
          game={game}
          sortedPlayers={sortedPlayers}
          winnerBannerData={modalState.winnerBannerData}
          correctAnswer={modalState.correctAnswer}
          showTimeUp={modalState.showTimeUp}
          timeRemaining={timeRemaining}
          isDrawer={isDrawer}
          currentTurn={currentTurn}
          currentCard={currentCard ?? null}
          onSelectWinner={handleOpenSelectWinner}
        />
      </div>

      {modalState.showSelectWinner && (
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
