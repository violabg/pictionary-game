"use server";

import { createClient } from "./client";
import { getCardTitle } from "./supabase-cards";
import {
  getGameCurrentCardId,
  getGameTimerDuration,
  updateGameTimerEnd,
} from "./supabase-games";
import { insertGuess } from "./supabase-guesses";
import { getPlayerScore } from "./supabase-players";
import type {
  AtomicTurnResult,
  CorrectGuessParams,
  ManualWinnerParams,
  TurnCompletionParams,
} from "./types";

const supabase = createClient();

// Submit a guess - simplified to only handle guess insertion
export const submitGuess = async (
  gameId: string,
  playerId: string,
  guessText: string,
  timeRemaining: number
): Promise<{ isCorrect: boolean; currentScore?: number }> => {
  try {
    // Get current card ID
    const currentCardId = await getGameCurrentCardId(gameId);

    // Get the card to check if guess is correct
    const card = await getCardTitle(currentCardId);

    // Check if guess is correct (case insensitive, trimmed)
    const isCorrect =
      guessText.toLowerCase().trim() === card.title.toLowerCase().trim();

    // Always insert the guess first
    await insertGuess(gameId, playerId, guessText, isCorrect);

    // If correct, return current score for reference
    if (isCorrect) {
      const currentScore = await getPlayerScore(playerId);
      return { isCorrect: true, currentScore };
    }

    return { isCorrect: false };
  } catch (error: unknown) {
    console.error("Error in submitGuess:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit guess";
    throw new Error(message);
  }
};

// Atomic turn completion functions
export async function completeCorrectGuessTurn(
  params: CorrectGuessParams
): Promise<AtomicTurnResult> {
  try {
    const { data, error } = await supabase.rpc(
      "complete_turn_with_correct_guess",
      {
        p_game_id: params.gameId,
        p_guesser_id: params.guesserId,
        p_guess_text: params.guessText,
        p_time_remaining: params.timeRemaining,
        p_drawing_image_url: params.drawingImageUrl,
      }
    );

    if (error) {
      console.error("Error completing correct guess turn:", error);
      return { success: false, game_completed: false };
    }

    return data[0] as AtomicTurnResult;
  } catch (error: unknown) {
    console.error("Error in completeCorrectGuessTurn:", error);
    return { success: false, game_completed: false };
  }
}

export async function completeTimeUpTurn(
  params: TurnCompletionParams
): Promise<AtomicTurnResult> {
  try {
    const { data, error } = await supabase.rpc("complete_turn_time_up", {
      p_game_id: params.gameId,
      p_drawing_image_url: params.drawingImageUrl,
    });

    if (error) {
      console.error("Error completing time up turn:", error);
      return { success: false, game_completed: false };
    }

    return data[0] as AtomicTurnResult;
  } catch (error: unknown) {
    console.error("Error in completeTimeUpTurn:", error);
    return { success: false, game_completed: false };
  }
}

export async function completeManualWinnerTurn(
  params: ManualWinnerParams
): Promise<AtomicTurnResult> {
  try {
    const { data, error } = await supabase.rpc("complete_turn_manual_winner", {
      p_game_id: params.gameId,
      p_winner_id: params.winnerId,
      p_time_remaining: params.timeRemaining,
      p_drawing_image_url: params.drawingImageUrl,
    });

    if (error) {
      console.error("Error completing manual winner turn:", error);
      return { success: false, game_completed: false };
    }

    return data[0] as AtomicTurnResult;
  } catch (error: unknown) {
    console.error("Error in completeManualWinnerTurn:", error);
    return { success: false, game_completed: false };
  }
}

// Legacy functions kept for backward compatibility during transition
export async function nextTurn(params: {
  gameId: string;
  cardId: string;
  pointsAwarded: number;
  winnerProfileId?: string | null;
  drawingImageUrl?: string | null;
}): Promise<void> {
  console.warn(
    "nextTurn is deprecated, use atomic turn completion functions instead"
  );
  // Implementation removed - use atomic functions
}

// Start the current turn
export async function startTurn(gameId: string): Promise<void> {
  try {
    // Get the game's timer duration
    const timerDuration = await getGameTimerDuration(gameId);

    // Calculate timer_end: current time + game's timer duration
    const timerEnd = new Date(Date.now() + timerDuration * 1000).toISOString();

    // Update game with timer_end
    await updateGameTimerEnd(gameId, timerEnd);
  } catch (error: unknown) {
    console.error("Error in startTurn:", error);
    const message =
      error instanceof Error ? error.message : "Failed to start turn";
    throw new Error(message);
  }
}
