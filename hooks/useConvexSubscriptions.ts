import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

/**
 * Hook to subscribe to game state
 * Returns game object that updates in real-time
 */
export const useGameState = (gameId: Id<"games"> | null) => {
  // Always call useQuery - the server-side query handles null gameId
  const game = useQuery(
    api.queries.games.getGame,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    game: gameId ? game : null,
    isLoading: gameId ? game === undefined : false,
  };
};

/**
 * Hook to subscribe to game players list
 */
export const useGamePlayers = (gameId: Id<"games"> | null) => {
  const players = useQuery(
    api.queries.players.getGamePlayers,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    players: gameId ? players : null,
    isLoading: gameId ? players === undefined : false,
  };
};

/**
 * Hook to subscribe to game guesses
 */
export const useGameGuesses = (gameId: Id<"games"> | null) => {
  const guesses = useQuery(
    api.queries.guesses.getGameGuesses,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    guesses: gameId ? guesses : null,
    isLoading: gameId ? guesses === undefined : false,
  };
};

/**
 * Hook to subscribe to turns history
 */
export const useTurnsHistory = (gameId: Id<"games"> | null) => {
  const turns = useQuery(
    api.queries.turns.getGameTurns,
    gameId
      ? { game_id: gameId, paginationOpts: { numItems: 50, cursor: null } }
      : { game_id: null as any, paginationOpts: { numItems: 50, cursor: null } }
  );

  return {
    turns: gameId ? turns : null,
    isLoading: gameId ? turns === undefined : false,
  };
};

/**
 * Hook to subscribe to current turn
 */
export const useCurrentTurn = (gameId: Id<"games"> | null) => {
  const turn = useQuery(
    api.queries.turns.getCurrentTurn,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    turn: gameId ? turn : null,
    isLoading: gameId ? turn === undefined : false,
  };
};

/**
 * Hook to subscribe to current card
 */
export const useCurrentCard = (gameId: Id<"games"> | null) => {
  const card = useQuery(
    api.queries.cards.getCurrentCard,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    card: gameId ? card : null,
    isLoading: gameId ? card === undefined : false,
  };
};

/**
 * Hook to subscribe to game leaderboard
 */
export const useGameLeaderboard = (gameId: Id<"games"> | null) => {
  const leaderboard = useQuery(
    api.queries.players.getGameLeaderboard,
    gameId ? { game_id: gameId } : { game_id: null as any }
  );

  return {
    leaderboard: gameId ? leaderboard : null,
    isLoading: gameId ? leaderboard === undefined : false,
  };
};
