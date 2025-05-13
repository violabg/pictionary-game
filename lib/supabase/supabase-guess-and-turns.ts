"use server";

import { createClient } from "./client";

// Initialize Supabase client for server-side operations
const supabase = createClient();

// Submit a guess
export async function submitGuess(
  gameId: string,
  playerId: string,
  guessText: string,
  timeRemaining: number
): Promise<void> {
  try {
    // Get current card
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("current_card_id")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error getting current card:", gameError);
      throw new Error("Failed to get current card");
    }

    if (!game || !game.current_card_id) {
      throw new Error("No active card found");
    }

    // Get the card to check if guess is correct
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("title")
      .eq("id", game.current_card_id)
      .single();

    if (cardError) {
      console.error("Error getting card:", cardError);
      throw new Error("Failed to get card");
    }

    if (!card) {
      throw new Error("Card not found");
    }

    // Check if guess is correct (case insensitive)
    const isCorrect = guessText.toLowerCase() === card.title.toLowerCase();

    // Insert guess
    const { error: insertError } = await supabase.from("guesses").insert({
      id: crypto.randomUUID(),
      game_id: gameId,
      player_id: playerId,
      guess_text: guessText,
      is_correct: isCorrect,
    });

    if (insertError) {
      console.error("Error inserting guess:", insertError);
      throw new Error("Failed to submit guess");
    }

    // If the guess is correct, automatically award points
    if (isCorrect) {
      // Get current score
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("score")
        .eq("id", playerId)
        .single();

      if (playerError) {
        console.error("Error getting player score:", playerError);
        throw new Error("Failed to get player score");
      }

      if (!player) {
        throw new Error("Player not found");
      }

      // Update player score
      const { error: updateError } = await supabase
        .from("players")
        .update({
          score: player.score + timeRemaining,
        })
        .eq("id", playerId);

      if (updateError) {
        console.error("Error updating score:", updateError);
        throw new Error("Failed to update score");
      }
      // Move to next turn
      await nextTurn(gameId);
    }
  } catch (error: any) {
    console.error("Error in submitGuess:", error);
    throw new Error(error.message || "Failed to submit guess");
  }
}

// Move to the next turn
export async function nextTurn(gameId: string): Promise<void> {
  try {
    // Get current game state
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("current_drawer_id")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error getting game:", gameError);
      throw new Error("Failed to get game");
    }

    if (!game) {
      throw new Error("Game not found");
    }

    // Get all players ordered by order_index
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, order_index")
      .eq("game_id", gameId)
      .order("order_index", { ascending: true });

    if (playersError) {
      console.error("Error getting players:", playersError);
      throw new Error("Failed to get players");
    }

    if (!players || players.length === 0) {
      throw new Error("No players found");
    }

    // Find the index of the current drawer
    const currentDrawerIndex = players.findIndex(
      (p) => p.id === game.current_drawer_id
    );

    // Calculate the next drawer index
    const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
    const nextDrawerId = players[nextDrawerIndex].id;

    // Get an unused card
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("id")
      .eq("game_id", gameId)
      .eq("used", false)
      .limit(1);

    if (cardsError) {
      console.error("Error getting card:", cardsError);
      throw new Error("Failed to get next card");
    }

    // If no more cards, end the game
    if (!cards || cards.length === 0) {
      const { error: endError } = await supabase
        .from("games")
        .update({
          status: "completed",
          current_drawer_id: null,
          current_card_id: null,
          timer_end: null,
        })
        .eq("id", gameId);

      if (endError) {
        console.error("Error ending game:", endError);
        throw new Error("Failed to end game");
      }

      return;
    }

    // Update game for next turn - don't set timer_end yet
    const { error: updateError } = await supabase
      .from("games")
      .update({
        current_drawer_id: nextDrawerId,
        current_card_id: cards[0].id,
        timer_end: null, // Don't set timer_end until drawer starts their turn
      })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game:", updateError);
      throw new Error("Failed to move to next turn");
    }

    // Mark card as used
    await supabase.from("cards").update({ used: true }).eq("id", cards[0].id);
  } catch (error: any) {
    console.error("Error in nextTurn:", error);
    throw new Error(error.message || "Failed to move to next turn");
  }
}

// Start the current turn
export async function startTurn(gameId: string): Promise<void> {
  try {
    // Get the timer value from the game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("timer")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error getting game timer:", gameError);
      throw new Error("Failed to get game timer");
    }

    const timerSeconds = game?.timer ?? 120;
    const timerEnd = new Date();
    timerEnd.setSeconds(timerEnd.getSeconds() + timerSeconds);

    // Update game with timer_end to indicate turn has started
    const { error: updateError } = await supabase
      .from("games")
      .update({
        timer_end: timerEnd.toISOString(),
      })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error starting turn:", updateError);
      throw new Error("Failed to start turn");
    }
  } catch (error: any) {
    console.error("Error in startTurn:", error);
    throw new Error(error.message || "Failed to start turn");
  }
}
