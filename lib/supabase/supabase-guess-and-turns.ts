"use server";

import { validateGuess } from "@/lib/utils/guess-validation";
import { createClient } from "./client";
import { getCardTitle } from "./supabase-cards";
import {
  getGameCurrentCardId,
  getGameTimerDuration,
  updateGameTimerEnd,
} from "./supabase-games";
import type {
  AtomicGuessParams,
  AtomicGuessResult,
  AtomicTurnResult,
  ManualWinnerParams,
  TurnCompletionParams,
} from "./types";

const supabase = createClient();

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

// Validate guess with AI (separate function for better UX)
export const validateGuessWithAI = async (
  gameId: string,
  guess: string,
  category: string
): Promise<{ isCorrect: boolean; explanation: string }> => {
  try {
    // Get the current card for validation
    const currentCardId = await getGameCurrentCardId(gameId);
    const card = await getCardTitle(currentCardId);

    const validationResult = await validateGuess({
      guess,
      correctAnswer: card.title,
      category,
    });

    return {
      isCorrect: validationResult.isCorrect,
      explanation: validationResult.explanation,
    };
  } catch (error: unknown) {
    console.error("Error in validateGuessWithAI:", error);
    return {
      isCorrect: false,
      explanation: "Validation failed due to an error",
    };
  }
};

// Atomic guess submission that handles both guess insertion and turn completion
// This prevents race conditions by doing everything in a single database transaction
export const submitGuessAtomic = async (
  params: AtomicGuessParams
): Promise<AtomicGuessResult> => {
  try {
    // Submit guess and complete turn if correct
    const { data, error } = await supabase.rpc(
      "submit_guess_and_complete_turn_if_correct",
      {
        p_game_id: params.gameId,
        p_guesser_profile_id: params.guesserProfileId,
        p_guess_text: params.guessText,
        p_time_remaining: params.timeRemaining,
        p_drawing_image_url: params.drawingImageUrl,
        p_is_correct: true, // Only call this function if validation passed
      }
    );

    if (error) {
      console.error("Error in atomic guess submission:", error);
      return {
        guess_id: null,
        is_correct: false,
        success: false,
        game_completed: false,
      };
    }

    return data[0] as AtomicGuessResult;
  } catch (error: unknown) {
    console.error("Error in submitGuessAtomic:", error);
    return {
      guess_id: null,
      is_correct: false,
      success: false,
      game_completed: false,
    };
  }
};
