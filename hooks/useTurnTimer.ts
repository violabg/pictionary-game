import { Doc } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";

interface UseTurnTimerProps {
  currentTurn: Doc<"turns"> | null | undefined;
  isPaused: boolean;
  onTimeUp: () => void;
}

/**
 * Custom hook to manage turn timer countdown
 * Handles draw-to-start timer semantics (timer only starts after first stroke)
 * @param currentTurn - The current turn object from Convex
 * @param isPaused - Whether the timer should be paused
 * @param onTimeUp - Callback when timer reaches 0
 * @returns timeRemaining - Seconds remaining in the turn
 */
export function useTurnTimer({
  currentTurn,
  isPaused,
  onTimeUp,
}: UseTurnTimerProps): number {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerEndedFlagRef = useRef(false);

  useEffect(() => {
    // Reset timer ended flag when turn changes
    timerEndedFlagRef.current = false;
  }, [currentTurn?._id]);

  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // If no active turn or turn hasn't started drawing, reset to default
    if (
      !currentTurn ||
      currentTurn.status !== "drawing" ||
      !currentTurn.started_at
    ) {
      // Don't call setState here - let the interval handle it or return early
      return;
    }

    // Calculate timer based on started_at
    const startTime = currentTurn.started_at;
    const timeLimit = currentTurn.time_limit;
    const endTime = startTime + timeLimit * 1000;

    const updateTimer = () => {
      if (!isPaused && !timerEndedFlagRef.current) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(diff);

        if (diff <= 0 && !timerEndedFlagRef.current) {
          timerEndedFlagRef.current = true;
          onTimeUp();
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        }
      }
    };

    // Initial update
    updateTimer();

    // Set up interval
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentTurn, isPaused, onTimeUp]);

  return timeRemaining;
}
