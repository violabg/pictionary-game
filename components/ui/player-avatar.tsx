"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface PlayerAvatarProps {
  /** The player profile containing name, username, and avatar URL */
  profile: {
    id: string;
    name?: string | null;
    user_name?: string | null;
    avatar_url?: string | null;
  };
  /** Additional CSS classes to merge with default avatar styles */
  className?: string;
  /** Additional CSS classes for the fallback text when no avatar image is available */
  fallbackClassName?: string;
}

/**
 * A reusable avatar component for displaying player profile pictures with fallback initials.
 * Automatically handles null/undefined names and generates initials as fallback.
 */

export function PlayerAvatar({
  profile,
  className,
  fallbackClassName,
}: PlayerAvatarProps) {
  const displayName = profile.name || profile.user_name;
  const initials = getInitials(displayName);

  return (
    <Avatar className={cn("", className)}>
      {profile.avatar_url && (
        <AvatarImage src={profile.avatar_url} alt={initials} />
      )}
      <AvatarFallback className={cn("", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
