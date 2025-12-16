import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export const useCurrentUserName = () => {
  const profile = useQuery(api.queries.profiles.getCurrentUserProfile);

  return profile?.username || "?";
};
