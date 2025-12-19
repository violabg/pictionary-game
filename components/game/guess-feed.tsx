"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle, XCircle } from "lucide-react";
import { memo, useEffect, useRef } from "react";

interface GuessFeedProps {
  guesses: Array<{
    _id: Id<"guesses">;
    player_id: string;
    guess_text: string;
    is_correct: boolean;
    is_fuzzy_match: boolean;
    submitted_at: number;
  }>;
  players: Array<{
    _id: Id<"players">;
    player_id: string;
    username: string;
    avatar_url?: string;
  }>;
  showAllGuesses?: boolean; // If false, hide correct answers until turn ends
}

// Phase 3: Optimized with React.memo to prevent unnecessary re-renders
function GuessFeed({
  guesses,
  players,
  showAllGuesses = true,
}: GuessFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest guess
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [guesses]);

  if (guesses.length === 0) {
    return (
      <Card className="bg-muted/50 p-4 border-dashed">
        <div className="text-muted-foreground text-sm text-center">
          In attesa di indovinelli...
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">
          Indovinelli ({guesses.length})
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 p-3 max-h-75 overflow-y-auto"
      >
        {guesses.map((guess) => {
          const player = players.find((p) => p.player_id === guess.player_id);
          const initials =
            player?.username
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "?";

          return (
            <div
              key={guess._id}
              className="slide-in-from-bottom-1 flex items-start gap-2 text-sm animate-in duration-300 fade-in"
            >
              <Avatar className="mt-0.5 w-7 h-7 shrink-0">
                {player?.avatar_url && (
                  <AvatarImage src={player.avatar_url} alt={player.username} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-xs truncate">
                    {player?.username || "Unknown"}
                  </span>

                  {guess.is_correct && showAllGuesses && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 border-green-300 text-green-700 text-xs"
                    >
                      <CheckCircle className="mr-1 w-3 h-3" />
                      Corretto!
                    </Badge>
                  )}
                  {guess.is_fuzzy_match && !guess.is_correct && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs"
                    >
                      Molto vicino!
                    </Badge>
                  )}
                  {!guess.is_correct && !guess.is_fuzzy_match && (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                </div>

                <div className="mt-0.5 text-muted-foreground text-xs">
                  &quot;{guess.guess_text}&quot;
                </div>
              </div>

              <span className="text-muted-foreground text-xs shrink-0">
                {formatTime(guess.submitted_at)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "ora";
  }
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m fa`;
  }
  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Export memoized version to prevent unnecessary re-renders
export default memo(GuessFeed);
