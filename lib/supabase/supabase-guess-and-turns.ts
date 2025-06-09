"use server";

import { getCardTitle, getUnusedCard, markCardAsUsed } from "./supabase-cards"; // Corrected import path
import {
  getGameCurrentCardId,
  getGameCurrentDrawerId,
  getGameTimerDuration,
  setGameAsCompleted,
  updateGameForNextTurn,
  updateGameTimerEnd,
} from "./supabase-games";
import { insertGuess } from "./supabase-guesses";
import {
  getPlayerScore,
  getPlayersForGameOrdered,
  updatePlayerScore,
} from "./supabase-players";
import { createTurn, getNextTurnNumber } from "./supabase-turns";

// Submit a guess
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

    // Insert guess
    await insertGuess(gameId, playerId, guessText, isCorrect);

    // If the guess is correct, get current score but don't automatically move to next turn
    if (isCorrect) {
      // Get current score
      const currentScore = await getPlayerScore(playerId);

      // Update player score
      await updatePlayerScore(playerId, currentScore + timeRemaining);

      // Return indication that guess was correct and let client handle nextTurn
      return { isCorrect: true, currentScore: currentScore + timeRemaining };
    }

    return { isCorrect: false };
  } catch (error: unknown) {
    console.error("Error in submitGuess:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit guess";
    throw new Error(message);
  }
};

// Move to the next turn
export async function nextTurn(params: {
  gameId: string;
  cardId: string;
  pointsAwarded: number;
  winnerProfileId?: string | null;
  drawingImageUrl?: string | null;
}): Promise<void> {
  const { gameId, cardId, winnerProfileId, pointsAwarded, drawingImageUrl } =
    params;
  try {
    // Get current game state
    const currentDrawerId = await getGameCurrentDrawerId(gameId);

    if (!currentDrawerId) {
      throw new Error("No current drawer found for the game");
    }
    const turnNumber = await getNextTurnNumber(gameId);

    // Mark the current card as used before moving to next turn
    if (cardId) {
      await markCardAsUsed(cardId);
    }

    // Create turn record
    await createTurn({
      gameId,
      cardId,
      drawerId: currentDrawerId,
      winnerProfileId,
      pointsAwarded,
      turnNumber,
      drawingImageUrl,
    });

    // Get all players ordered by order_index
    const players = await getPlayersForGameOrdered(gameId);

    // Find the index of the current drawer
    const currentDrawerIndex = players.findIndex(
      (p) => p.player_id === currentDrawerId
    );

    // Calculate the next drawer index
    const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;

    const nextDrawerId = players[nextDrawerIndex].player_id ?? "";

    const cardToUse = await getUnusedCard(gameId);

    if (cardToUse) {
      // Update game with new drawer and card
      await updateGameForNextTurn(gameId, nextDrawerId, cardToUse.id);
      // Note: We don't mark the new card as used here - it will be marked when that turn ends
    } else {
      // If no cards are available, set the game as completed
      await setGameAsCompleted(gameId);
    }
  } catch (error: unknown) {
    console.error("Error in nextTurn:", error);
    const message =
      error instanceof Error ? error.message : "Failed to move to next turn";
    throw new Error(message);
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
