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
