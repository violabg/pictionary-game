"use client";

import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef } from "react";

/**
 * ProfileInitializer component ensures a profile is created for authenticated users.
 * This handles OAuth signup where we don't explicitly call createProfileIfNotExists.
 * It should be placed in a layout or high-level component to run on app load.
 */
export function ProfileInitializer() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const createOrGetOAuthProfile = useMutation(api.auth.createOrGetOAuthProfile);
  const hasTriedCreation = useRef(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Only try once and only if authenticated
    if (isAuthenticated && !hasTriedCreation.current) {
      hasTriedCreation.current = true;
      createOrGetOAuthProfile({
        username: undefined,
        email: undefined,
        avatar_url: undefined,
      }).catch((error) => {
        console.error("Failed to initialize profile:", error);
        // Silently fail - profile might have been created by another request
      });
    }
  }, [authLoading, isAuthenticated, createOrGetOAuthProfile]);

  return null;
}
