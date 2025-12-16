"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedUser } from "@/lib/hooks/useAuthenticatedUser";
import { captureAndUploadDrawing } from "@/lib/utils/drawing-utils";
import { useMutation, useQuery } from "convex/react";
import { Crown, PlayCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import CardDisplay from "./card-display";
import DrawingCanvas, { DrawingCanvasRef } from "./drawing-canvas";
import GuessInput from "./guess-input";
import PlayerList from "./player-list";
import ScoreLegend from "./score-legend";
import SelectWinnerModal from "./select-winner-modal";
import Timer from "./timer";

interface GameBoardProps {
  gameId: Id<"games">;
  code: string;
}

// Consolidated game state interface
interface GameState {
  currentCard: Doc<"cards"> | null;
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
}

export default function GameBoard({ gameId, code }: GameBoardProps) {
  const { profile } = useAuthenticatedUser();
  const game = useQuery(api.queries.games.getGameById, { game_id: gameId });
  const players = useQuery(api.queries.players.getGamePlayers, {
    game_id: gameId,
  });
  const currentTurn = useQuery(api.queries.turns.getCurrentTurn, {
    game_id: gameId,
  });
  const currentCard = useQuery(
    api.queries.cards.getCard,
    currentTurn && currentTurn.card_id
      ? { card_id: currentTurn.card_id }
      : "skip"
  );

  // Mutations
  const startNewTurnMutation = useMutation(api.mutations.game.startNewTurn);
  const submitGuessAndCompleteTurnMutation = useMutation(
    api.mutations.game.submitGuessAndCompleteTurn
  );
  const completeGameTurnMutation = useMutation(
    api.mutations.game.completeGameTurn
  );

  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  });

  const [correctGuessers, setCorrectGuessers] = useState<Doc<"players">[]>([]);

  // Check loading states
  if (!game || !players || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  const currentDrawer = useMemo(
    () => players.find((p) => p.player_id === game.current_drawer_id),
    [players, game.current_drawer_id]
  );

  const currentPlayer = useMemo(
    () => players.find((p) => p.player_id === profile.user_id),
    [players, profile.user_id]
  );

  // Helper function to capture drawing for atomic turn completion
  const captureDrawing = useCallback(async (): Promise<string | undefined> => {
    if (!drawingCanvasRef.current) return undefined;

    try {
      const canvasDataUrl = drawingCanvasRef.current.captureDrawing();
      if (canvasDataUrl) {
        const uploadedUrl = await captureAndUploadDrawing(
          gameId.toString(),
          canvasDataUrl
        );
        return uploadedUrl || undefined;
      }
    } catch (error) {
      console.error("Error capturing drawing:", error);
    }
    return undefined;
  }, [gameId]);

  // Handle time up scenario
  const handleTimeUp = useCallback(async () => {
    if (!gameState.isDrawer || gameState.turnEnded || !currentTurn) return;

    setGameState((prev) => ({ ...prev, turnEnded: true }));

    try {
      const drawingImageUrl = gameState.isDrawer
        ? await captureDrawing()
        : undefined;

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
      toast.error("Errore", {
        description: "Impossibile completare il turno",
      });
      setGameState((prev) => ({ ...prev, turnEnded: false }));
    }
  }, [
    gameState.isDrawer,
    gameState.turnEnded,
    currentTurn,
    gameId,
    captureDrawing,
    completeGameTurnMutation,
  ]);

  // Update game state when game changes
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      isDrawer: game.current_drawer_id === profile?.user_id,
      turnStarted: currentTurn?.status === "drawing",
      turnEnded: false,
      currentTurnId: currentTurn?._id ?? null,
    }));
  }, [
    game.current_drawer_id,
    profile?.user_id,
    currentTurn?.status,
    currentTurn?._id,
  ]);

  // Update current card
  useEffect(() => {
    if (currentCard && gameState.isDrawer) {
      setGameState((prev) => ({ ...prev, currentCard }));
    } else {
      setGameState((prev) => ({ ...prev, currentCard: null }));
    }
  }, [currentCard, gameState.isDrawer]);

  // Timer logic effect
  useEffect(() => {
    if (!gameState.turnStarted || !currentTurn) return;

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

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPlayer || gameState.turnEnded || !currentTurn) return;

    try {
      const result = await submitGuessAndCompleteTurnMutation({
        game_id: gameId,
        turn_id: currentTurn._id,
        guess_text: guess,
      });

      if (!result.is_correct) {
        toast.error("Risposta errata", {
          description: "Riprova con un'altra risposta!",
        });
        return;
      }

      // Correct guess
      setGameState((prev) => ({ ...prev, turnEnded: true }));
      toast.success("Corretto!", {
        description: `Hai indovinato e guadagnato punti!`,
      });
    } catch (error) {
      console.error("Error in guess submission:", error);
      toast.error("Errore", {
        description: "Impossibile inviare il tuo indovino",
      });
    }
  };

  const handleSelectWinner = async (winner: Doc<"players">) => {
    if (gameState.turnEnded || !currentTurn) return;

    try {
      setGameState((prev) => ({ ...prev, turnEnded: true }));

      await completeGameTurnMutation({
        game_id: gameId,
        turn_id: currentTurn._id,
        reason: "manual",
      });

      toast.success("Vincitore selezionato!", {
        description: `${winner.username} è stato selezionato come vincitore!`,
      });

      setModalState((prev) => ({
        ...prev,
        showSelectWinner: false,
        isTimerPaused: false,
      }));
      setCorrectGuessers([]);
    } catch (error) {
      console.error("Error selecting winner:", error);
      setGameState((prev) => ({ ...prev, turnEnded: false }));
      toast.error("Errore", {
        description: "Impossibile selezionare il vincitore",
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
      toast.error("Errore", {
        description: "Impossibile avviare il turno",
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
            <Timer seconds={gameState.timeRemaining} totalTime={60} />
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
    </div>
  );
}
