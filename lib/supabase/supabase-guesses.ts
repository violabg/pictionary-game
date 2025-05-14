import { createClient } from "./client";

const supabase = createClient();

export const insertGuess = async (
  gameId: string,
  playerId: string,
  guessText: string,
  isCorrect: boolean
) => {
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
};
