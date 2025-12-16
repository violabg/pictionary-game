import { api } from "@/convex/_generated/api";
import { useAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";

/**
 * Hook to get current authenticated user with profile
 */
export const useAuthenticatedUser = () => {
  const { isAuthenticated, user } = useAuth();
  const profile = useQuery(api.queries.profiles.getCurrentUserProfile);

  return {
    isAuthenticated,
    user,
    profile,
    isLoading: profile === undefined,
  };
};

/**
 * Hook to get user's current game session
 */
export const useCurrentGame = () => {
  const { isAuthenticated } = useAuth();
  const gameId = useQuery(
    isAuthenticated ? api.queries.games.getCurrentUserGame : "skip"
  );

  return {
    gameId,
    isLoading: gameId === undefined,
  };
};
