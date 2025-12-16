import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Hook to get current authenticated user with profile
 */
export const useAuthenticatedUser = () => {
  const profile = useQuery(api.queries.profiles.getCurrentUserProfile);
  const isAuthenticated = profile !== null && profile !== undefined;

  return {
    isAuthenticated,
    user: profile,
    profile,
    isLoading: profile === undefined,
  };
};

/**
 * Hook to get user's current game session
 */
export const useCurrentGame = () => {
  const profile = useQuery(api.queries.profiles.getCurrentUserProfile);
  const isAuthenticated = profile !== null && profile !== undefined;

  // Always call useQuery, but it will handle unauthenticated case server-side
  const gameId = useQuery(api.queries.games.getCurrentUserGame);

  return {
    gameId,
    isLoading: gameId === undefined,
  };
};
