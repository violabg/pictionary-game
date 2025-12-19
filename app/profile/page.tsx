"use client";

import { useAuthenticatedUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ProfileContent } from "./ProfileContent";
import { ProfileContentError } from "./ProfileContentError";
import { ProfileContentFallback } from "./ProfileContentFallback";

function ProfileLoader() {
  const { profile, isLoading } = useAuthenticatedUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !profile) {
      router.push("/auth/login");
    }
  }, [isLoading, profile, router]);

  if (isLoading) {
    return <ProfileContentFallback />;
  }

  if (!profile) {
    return <ProfileContentError error="Profilo non trovato" />;
  }

  return (
    <ProfileContent
      profile={{
        id: profile._id,
        username: profile.username,
        email: profile.email,
        avatar_url: profile.avatar_url,
        total_score: profile.total_score,
        games_played: profile.games_played,
      }}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileContentFallback />}>
      <ProfileLoader />
    </Suspense>
  );
}
