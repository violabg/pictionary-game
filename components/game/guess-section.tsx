"use client";

import { Doc, Id } from "@/convex/_generated/dataModel";
import GuessFeed from "./guess-feed";
import GuessInput from "./guess-input";

// Type for projected guess from query
type TurnGuess = {
  _id: Id<"guesses">;
  player_id: string;
  guess_text: string;
  is_correct: boolean;
  is_fuzzy_match: boolean;
  submitted_at: number;
};

interface GuessSectionProps {
  isDrawer: boolean;
  turnStarted: boolean;
  currentTurn: Doc<"turns"> | null | undefined;
  turnGuesses: TurnGuess[] | undefined;
  players: Doc<"players">[];
  onGuessSubmit: (guess: string) => Promise<void>;
}

export function GuessSection({
  isDrawer,
  turnStarted,
  currentTurn,
  turnGuesses,
  players,
  onGuessSubmit,
}: GuessSectionProps) {
  return (
    <>
      {!isDrawer && turnStarted && currentTurn?.started_at && (
        <div className="mt-4">
          <GuessInput onSubmit={onGuessSubmit} disabled={isDrawer} />
        </div>
      )}

      {turnStarted && turnGuesses && turnGuesses.length > 0 && (
        <div className="mt-4">
          <GuessFeed
            guesses={turnGuesses}
            players={players}
            showAllGuesses={true}
          />
        </div>
      )}
    </>
  );
}
