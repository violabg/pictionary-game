import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

/**
 * Hook to subscribe to game state
 * Returns game object that updates in real-time
 */
export const useGameState = (gameId: Id<"games"> | null) => {
  const game = useQuery(
    gameId ? api.queries.games.getGame : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    game,
    isLoading: game === undefined,
  };
};

/**
 * Hook to subscribe to game players list
 */
export const useGamePlayers = (gameId: Id<"games"> | null) => {
  const players = useQuery(
    gameId ? api.queries.players.getGamePlayers : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    players,
    isLoading: players === undefined,
  };
};

/**
 * Hook to subscribe to game guesses
 */
export const useGameGuesses = (gameId: Id<"games"> | null) => {
  const guesses = useQuery(
    gameId ? api.queries.guesses.getGameGuesses : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    guesses,
    isLoading: guesses === undefined,
  };
};

/**
 * Hook to subscribe to turns history
 */
export const useTurnsHistory = (gameId: Id<"games"> | null) => {
  const turns = useQuery(
    gameId ? api.queries.turns.getGameTurns : "skip",
    gameId
      ? { game_id: gameId, paginationOpts: { numItems: 50, cursor: null } }
      : "skip"
  );

  return {
    turns,
    isLoading: turns === undefined,
  };
};

/**
 * Hook to subscribe to current turn
 */
export const useCurrentTurn = (gameId: Id<"games"> | null) => {
  const turn = useQuery(
    gameId ? api.queries.turns.getCurrentTurn : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    turn,
    isLoading: turn === undefined,
  };
};

/**
 * Hook to subscribe to current card
 */
export const useCurrentCard = (gameId: Id<"games"> | null) => {
  const card = useQuery(
    gameId ? api.queries.cards.getCurrentCard : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    card,
    isLoading: card === undefined,
  };
};

/**
 * Hook to subscribe to game leaderboard
 */
export const useGameLeaderboard = (gameId: Id<"games"> | null) => {
  const leaderboard = useQuery(
    gameId ? api.queries.players.getGameLeaderboard : "skip",
    gameId ? { game_id: gameId } : "skip"
  );

  return {
    leaderboard,
    isLoading: leaderboard === undefined,
  };
};
