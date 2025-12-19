import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseDrawerTurnActionsProps {
  gameId: Id<"games">;
  currentTurn: Doc<"turns"> | null | undefined;
  isDrawer: boolean;
  drawingCanvasRef: React.RefObject<{
    captureDrawing: () => string | null;
  } | null>;
}

export function useDrawerTurnActions({
  gameId,
  currentTurn,
  isDrawer,
  drawingCanvasRef,
}: UseDrawerTurnActionsProps) {
  const startNewTurnMutation = useMutation(api.mutations.game.startNewTurn);
  const completeGameTurnMutation = useMutation(
    api.mutations.game.completeGameTurn
  );
  const setTurnStartTimeMutation = useMutation(
    api.mutations.game.setTurnStartTime
  );
  const uploadDrawingAction = useAction(
    api.actions.uploadDrawing.uploadDrawingScreenshot
  );

  const turnStartTimeSetRef = useRef(false);

  // Reset ref when turn changes
  if (currentTurn?._id) {
    // This is safe because refs don't trigger re-renders
    if (turnStartTimeSetRef.current) {
      turnStartTimeSetRef.current = false;
    }
  }

  const captureAndUploadDrawing = useCallback(
    async (maxRetries = 3): Promise<Id<"_storage"> | null> => {
      if (!isDrawer || !drawingCanvasRef.current || !currentTurn) {
        return null;
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const canvasDataUrl = drawingCanvasRef.current.captureDrawing();
          if (!canvasDataUrl) {
            console.warn("No canvas data to capture");
            return null;
          }

          const response = await fetch(canvasDataUrl);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();

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

          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 500)
          );
        }
      }

      return null;
    },
    [isDrawer, currentTurn, gameId, uploadDrawingAction, drawingCanvasRef]
  );

  const handleStartTurn = useCallback(async () => {
    if (!isDrawer) return;

    try {
      await startNewTurnMutation({ game_id: gameId });
    } catch (error) {
      console.error("Error starting turn:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Impossibile avviare il turno";
      toast.error("Errore", {
        description: errorMessage,
        duration: 5000,
      });
      throw error;
    }
  }, [isDrawer, gameId, startNewTurnMutation]);

  const handleTimeUp = useCallback(async () => {
    if (!isDrawer || !currentTurn) return;

    try {
      toast.info("Salvando il disegno...");
      const drawingStorageId = await captureAndUploadDrawing();

      if (!drawingStorageId) {
        console.warn("Failed to upload drawing, completing turn anyway");
      }

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
      throw error;
    }
  }, [
    isDrawer,
    currentTurn,
    gameId,
    captureAndUploadDrawing,
    completeGameTurnMutation,
  ]);

  const handleSelectWinner = useCallback(
    async (winner: Doc<"players">, timeRemaining: number) => {
      if (!isDrawer || !currentTurn) return;

      try {
        toast.info("Salvando il disegno...");
        const drawingStorageId = await captureAndUploadDrawing();

        if (!drawingStorageId) {
          console.warn("Failed to upload drawing, completing turn anyway");
        }

        await completeGameTurnMutation({
          game_id: gameId,
          turn_id: currentTurn._id,
          reason: "manual",
          winner_id: winner.player_id,
          points_awarded: Math.max(0, Math.floor(timeRemaining)),
        });

        toast.success("Vincitore selezionato!", {
          description: `${winner.username} è stato selezionato come vincitore!`,
        });
      } catch (error) {
        console.error("Error selecting winner:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Impossibile selezionare il vincitore";
        toast.error("Errore", {
          description: errorMessage,
          duration: 5000,
        });
        throw error;
      }
    },
    [
      isDrawer,
      currentTurn,
      gameId,
      captureAndUploadDrawing,
      completeGameTurnMutation,
    ]
  );

  const handleFirstStroke = useCallback(async () => {
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
  }, [currentTurn, gameId, setTurnStartTimeMutation]);

  return {
    handleStartTurn,
    handleTimeUp,
    handleSelectWinner,
    handleFirstStroke,
    captureAndUploadDrawing,
  };
}
