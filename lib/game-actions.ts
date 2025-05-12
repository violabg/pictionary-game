"use server";

import { Card, Game, Player } from "@/types/supabase";
import { cookies } from "next/headers";
import { createClient } from "./supabase/client";

// Initialize Supabase client for server-side operations
const supabase = createClient();

// Create a new game
export async function createGame(
  username: string,
  category: string,
  difficulty = "medium",
  timer = 120
): Promise<string> {
  try {
    console.log(
      "Creating game with username:",
      username,
      "category:",
      category,
      "and difficulty:",
      difficulty,
      "and timer:",
      timer
    );

    // Create a unique game ID
    const gameId = crypto.randomUUID();
    console.log("Generated game ID:", gameId);

    // Create game with direct insert
    console.log("Inserting game into database...");
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          id: gameId,
          category,
          status: "waiting",
          cards_generated: false,
          difficulty: difficulty, // Store the difficulty level
          timer: timer, // Store the timer value
        })
        .select();

      if (gameError) {
        console.error("Error creating game:", gameError);
        console.error("Error details:", JSON.stringify(gameError));

        // If the error is because the table doesn't exist, provide a helpful message
        if (gameError.code === "42P01") {
          throw new Error(
            "Database tables not set up. Please run the setup SQL script first."
          );
        }

        throw new Error(
          `Failed to create game: ${
            gameError.message || JSON.stringify(gameError)
          }`
        );
      }

      console.log("Game created successfully:", gameData);
    } catch (insertError: any) {
      console.error("Game insert error caught:", insertError);
      throw new Error(
        `Failed to create game: ${
          insertError.message || JSON.stringify(insertError)
        }`
      );
    }

    // Create player with direct insert
    const playerId = crypto.randomUUID();
    console.log("Generated player ID:", playerId);

    console.log("Inserting player into database...");
    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          id: playerId,
          game_id: gameId,
          username,
          score: 0,
          order_index: 0,
        })
        .select();

      if (playerError) {
        console.error("Error creating player:", playerError);
        console.error("Error details:", JSON.stringify(playerError));
        throw new Error(
          `Failed to create player: ${
            playerError.message || JSON.stringify(playerError)
          }`
        );
      }

      console.log("Player created successfully:", playerData);
    } catch (insertError: any) {
      console.error("Player insert error caught:", insertError);
      throw new Error(
        `Failed to create player: ${
          insertError.message || JSON.stringify(insertError)
        }`
      );
    }

    // Store player ID in cookies for identification
    const cookieStore = await cookies();
    cookieStore.set("playerId", playerId, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "strict",
    });

    console.log("Player ID stored in cookies");
    console.log("Returning game ID:", gameId);

    return gameId;
  } catch (error: any) {
    console.error("Error in createGame:", error);
    console.error("Error stack:", error.stack);
    throw new Error(error.message || "Failed to create game");
  }
}

// Join an existing game
export async function joinGame(
  username: string,
  gameId: string
): Promise<{ success: boolean; message?: string; gameStatus?: string }> {
  try {
    // Check if game exists and is in waiting status
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("status")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error finding game:", gameError);
      return { success: false, message: "Game not found" };
    }

    if (!game) {
      return { success: false, message: "Game not found" };
    }

    if (game.status !== "waiting") {
      // Return status instead of throwing error
      return {
        success: false,
        message: "Game has already started",
        gameStatus: game.status,
      };
    }

    // Check if username is already taken in this game
    const { data: existingPlayer, error: usernameError } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("username", username)
      .maybeSingle();

    if (usernameError) {
      console.error("Error checking username:", usernameError);
      return {
        success: false,
        message: "Failed to check username availability",
      };
    }

    if (existingPlayer) {
      return {
        success: false,
        message:
          "Username already taken in this game. Please choose another username.",
      };
    }

    // Get current player count for order_index
    const { data: players, error: countError } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId);

    if (countError) {
      console.error("Error counting players:", countError);
      return { success: false, message: "Failed to join game" };
    }

    const count = players?.length || 0;

    // Create player with direct insert
    const playerId = crypto.randomUUID();
    const { error: playerError } = await supabase.from("players").insert({
      id: playerId,
      game_id: gameId,
      username,
      score: 0,
      order_index: count,
    });

    if (playerError) {
      console.error("Error creating player:", playerError);
      return { success: false, message: "Failed to join game" };
    }

    // Store player ID in cookies for identification
    const cookieStore = await cookies();
    cookieStore.set("playerId", playerId, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "strict",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in joinGame:", error);
    return { success: false, message: error.message || "Failed to join game" };
  }
}

// Get game data
export async function getGame(gameId?: string): Promise<Game> {
  if (!gameId) {
    throw new Error("Game ID is required");
  }
  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Error getting game:", error);
      throw new Error("Game not found");
    }

    if (!data) {
      throw new Error("Game not found");
    }

    return data as Game;
  } catch (error: any) {
    console.error("Error in getGame:", error);
    throw new Error(error.message || "Failed to get game");
  }
}

// Get players in a game
export async function getPlayers(gameId?: string): Promise<Player[]> {
  if (!gameId) {
    throw new Error("Game ID is required");
  }
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error getting players:", error);
      throw new Error("Failed to get players");
    }

    return (data as Player[]) || [];
  } catch (error: any) {
    console.error("Error in getPlayers:", error);
    throw new Error(error.message || "Failed to get players");
  }
}

// Get a specific card
export async function getCard(cardId: string): Promise<Card> {
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (error) {
      console.error("Error getting card:", error);
      throw new Error("Card not found");
    }

    if (!data) {
      throw new Error("Card not found");
    }

    return data as Card;
  } catch (error: any) {
    console.error("Error in getCard:", error);
    throw new Error(error.message || "Failed to get card");
  }
}

// Start the game
export async function startGame(gameId: string): Promise<void> {
  try {
    // Get players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .order("order_index", { ascending: true });

    if (playersError) {
      console.error("Error getting players:", playersError);
      throw new Error("Failed to get players");
    }

    if (!players || players.length < 2) {
      throw new Error("Not enough players to start the game");
    }

    // Get an unused card
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("id")
      .eq("game_id", gameId)
      .eq("used", false)
      .limit(1);

    if (cardsError) {
      console.error("Error getting card:", cardsError);
      throw new Error("Failed to get card");
    }

    if (!cards || cards.length === 0) {
      throw new Error("No cards available");
    }

    // Update game status - don't set timer_end yet
    const { error: updateError } = await supabase
      .from("games")
      .update({
        status: "active",
        current_drawer_id: players[0].id,
        current_card_id: cards[0].id,
        timer_end: null, // Don't set timer_end until drawer starts their turn
      })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game:", updateError);
      throw new Error("Failed to start game");
    }

    // Mark card as used
    await supabase.from("cards").update({ used: true }).eq("id", cards[0].id);
  } catch (error: any) {
    console.error("Error in startGame:", error);
    throw new Error(error.message || "Failed to start game");
  }
}

// Generate cards for a game
export async function generateCards(
  gameId: string,
  category: string,
  playerCount: number
): Promise<void> {
  try {
    // Get the game to determine the difficulty
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("difficulty")
      .eq("id", gameId)
      .single();

    if (gameError) {
      console.error("Error getting game difficulty:", gameError);
      throw new Error("Failed to get game difficulty");
    }

    // Use the seed cards function with the appropriate difficulty
    const { seedCardsForGame } = await import("./seed-cards");
    await seedCardsForGame(
      gameId,
      category,
      game?.difficulty || "medium",
      playerCount
    );

    console.log(
      `Successfully generated cards for game ${gameId} using seed data with difficulty ${
        game?.difficulty || "medium"
      }`
    );
  } catch (error: any) {
    console.error("Error in generateCards:", error);
    throw new Error(error.message || "Failed to generate cards");
  }
}

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

// Select a winner for a correct guess
export async function selectWinner(
  gameId: string,
  winnerId: string,
  timeRemaining: number
): Promise<void> {
  try {
    // Get current score
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("score")
      .eq("id", winnerId)
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
      .eq("id", winnerId);

    if (updateError) {
      console.error("Error updating score:", updateError);
      throw new Error("Failed to update score");
    }

    // Move to next turn
    await nextTurn(gameId);
  } catch (error: any) {
    console.error("Error in selectWinner:", error);
    throw new Error(error.message || "Failed to select winner");
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

// Check if username is available in a game
export async function checkUsernameAvailability(
  username: string,
  gameId: string
): Promise<{ available: boolean; message?: string }> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error checking username:", error);
      return {
        available: false,
        message: "Failed to check username availability",
      };
    }

    return {
      available: !data,
      message: data
        ? "Username already taken in this game. Please choose another username."
        : undefined,
    };
  } catch (error: any) {
    console.error("Error in checkUsernameAvailability:", error);
    return {
      available: false,
      message: error.message || "Failed to check username availability",
    };
  }
}
