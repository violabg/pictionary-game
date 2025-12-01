"use client";

import { AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TurnWithDetails } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, Crown, Trophy, Users, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

// Function to get category-specific styling
const getCategoryStyle = (category: string) => {
  const categoryStyles: Record<string, string> = {
    Animali:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    Cibo: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    Film: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    Sport:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    Tecnologia:
      "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800",
    Geografia:
      "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800",
    Musica:
      "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800",
    Arte: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
  };

  return (
    categoryStyles[category] ||
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800"
  );
};

interface GameHistoryCardProps {
  game: {
    id: string;
    code: string;
    category: string;
    status: string;
    created_at: string;
    turns_count: number;
    user_score: number;
    total_turns: TurnWithDetails[];
    players?: Array<{
      id: string;
      score: number;
      profile: {
        id: string;
        name: string | null;
        user_name: string | null;
        avatar_url: string | null;
      };
    }>;
  };
}

export default function GameHistoryCard({ game }: GameHistoryCardProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    thumbnailRect?: DOMRect;
  } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "animating" | "final"
  >("initial");
  const modalRef = useRef<HTMLDivElement>(null);

  const openImageModal = (
    url: string,
    title: string,
    thumbnailElement: HTMLElement
  ) => {
    const thumbnailRect = thumbnailElement.getBoundingClientRect();
    setSelectedImage({ url, title, thumbnailRect });
    setIsClosing(false);
    setAnimationPhase("initial");

    // Start animation on next frame
    requestAnimationFrame(() => {
      setAnimationPhase("animating");
      setTimeout(() => {
        setAnimationPhase("final");
      }, 50);
    });
  };

  const closeImageModal = () => {
    setIsClosing(true);
    setAnimationPhase("initial");
    setTimeout(() => {
      setSelectedImage(null);
      setIsClosing(false);
      setAnimationPhase("initial");
    }, 300); // Match the animation duration
  };

  const gameWinner = useMemo(() => {
    if (!game.players || game.players.length === 0) {
      // Fallback: find winner from turns data
      const playerScores = new Map<
        string,
        {
          score: number;
          profile: {
            id: string;
            name: string | null;
            user_name: string | null;
            avatar_url: string | null;
          };
        }
      >();

      game.total_turns.forEach((turn) => {
        // Add drawer points
        if (!playerScores.has(turn.drawer.id)) {
          playerScores.set(turn.drawer.id, {
            score: 0,
            profile: turn.drawer
          });
        }
        const drawerEntry = playerScores.get(turn.drawer.id)!;
        drawerEntry.score += turn.drawer_points_awarded || 0;

        // Add winner points
        if (turn.winner) {
          if (!playerScores.has(turn.winner.id)) {
            playerScores.set(turn.winner.id, {
              score: 0,
              profile: turn.winner
            });
          }
          const winnerEntry = playerScores.get(turn.winner.id)!;
          winnerEntry.score += turn.points_awarded || 0;
        }
      });

      // Find highest score
      let highestScore = 0;
      let winner: {
        id: string;
        name: string | null;
        user_name: string | null;
        avatar_url: string | null;
        score: number;
      } | null = null;

      for (const [, playerData] of playerScores) {
        if (playerData.score > highestScore) {
          highestScore = playerData.score;
          winner = { ...playerData.profile, score: playerData.score };
        }
      }

      return winner;
    }

    // Use players data if available
    return game.players.reduce((winner, player) => {
      if (!winner || player.score > winner.score) {
        return {
          ...player.profile,
          score: player.score,
        };
      }
      return winner;
    }, null as { id: string; name: string | null; user_name: string | null; avatar_url: string | null; score: number } | null);
  }, [game.players, game.total_turns]);

  return (
    <>
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex justify-between items-start w-full">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Partita #{game.code}
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(game.created_at), "dd/MM/yyyy HH:mm")}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {game.turns_count} turni
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn("border", getCategoryStyle(game.category))}
            >
              {game.category}
            </Badge>
            {gameWinner ? (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <PlayerAvatar profile={gameWinner} className="w-6 h-6" />
                  <div className="text-muted-foreground text-xs">
                    {gameWinner.name || gameWinner.user_name}
                  </div>
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <div className="font-bold text-primary text-xl">
                    {gameWinner.score}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="font-bold text-muted-foreground text-xl">
                  N/A
                </div>
                <div className="text-muted-foreground text-xs">
                  Nessun vincitore
                </div>
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        {game.total_turns.length > 0 ? (
          <div className="space-y-3">
            <h4 className="mb-4 font-semibold text-sm">Turni della partita:</h4>
            <div className="gap-3 grid overflow-y-auto">
              {game.total_turns.map((turn, index) => (
                <div
                  key={turn.id}
                  className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8 font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {turn.card.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {turn.points_awarded} punti
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <span>Disegnato da</span>
                        <PlayerAvatar
                          profile={turn.drawer}
                          className="w-4 h-4"
                          fallbackClassName="text-[8px]"
                        />
                        <span className="font-medium">
                          {turn.drawer.name || turn.drawer.user_name}
                        </span>
                      </div>
                      {turn.winner ? (
                        <div className="flex items-center gap-1">
                          <span>Vinto da</span>
                          <PlayerAvatar
                            profile={turn.winner}
                            className="w-4 h-4"
                            fallbackClassName="text-[8px]"
                          />
                          <span className="font-medium">
                            {turn.winner.name || turn.winner.user_name}
                          </span>
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </div>
                      ) : (
                        <span className="font-medium text-muted-foreground">
                          Nessun vincitore
                        </span>
                      )}
                    </div>
                  </div>

                  {turn.drawing_image_url && (
                    <div className="flex-shrink-0">
                      <div
                        className="relative bg-white hover:shadow-lg border rounded-lg w-16 h-16 overflow-hidden hover:scale-110 transition-all duration-200 ease-out cursor-pointer transform"
                        onClick={(e) =>
                          openImageModal(
                            turn.drawing_image_url!,
                            turn.card.title,
                            e.currentTarget
                          )
                        }
                      >
                        <Image
                          src={turn.drawing_image_url}
                          alt={`Disegno per "${turn.card.title}"`}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-muted-foreground text-center">
            <Trophy className="opacity-50 mx-auto mb-2 w-12 h-12" />
            <p>Nessun turno registrato per questa partita</p>
          </div>
        )}
      </AccordionContent>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out p-4 ${
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          }`}
          onClick={closeImageModal}
        >
          <Card
            ref={modalRef}
            className="relative p-[2px] pt-8 gradient-border w-full min-w-[300px] max-w-[800px] glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform:
                selectedImage.thumbnailRect && animationPhase === "initial"
                  ? `translate(${
                      selectedImage.thumbnailRect.left +
                      selectedImage.thumbnailRect.width / 2 -
                      window.innerWidth / 2
                    }px, ${
                      selectedImage.thumbnailRect.top +
                      selectedImage.thumbnailRect.height / 2 -
                      window.innerHeight / 2
                    }px) scale(${
                      selectedImage.thumbnailRect.width /
                      Math.min(800, Math.max(300, window.innerWidth * 0.8))
                    })`
                  : isClosing && selectedImage.thumbnailRect
                  ? `translate(${
                      selectedImage.thumbnailRect.left +
                      selectedImage.thumbnailRect.width / 2 -
                      window.innerWidth / 2
                    }px, ${
                      selectedImage.thumbnailRect.top +
                      selectedImage.thumbnailRect.height / 2 -
                      window.innerHeight / 2
                    }px) scale(${
                      selectedImage.thumbnailRect.width /
                      Math.min(800, Math.max(300, window.innerWidth * 0.8))
                    })`
                  : "translate(0, 0) scale(1)",
              transition: isClosing
                ? "transform 300ms cubic-bezier(0.4, 0.0, 1, 1)"
                : "transform 300ms cubic-bezier(0.0, 0.0, 0.2, 1)",
            }}
          >
            <CardHeader className="relativeoverflow-hidden">
              {/* Close button */}
              <div className="top-7 right-4 z-10 absolute">
                <button
                  onClick={closeImageModal}
                  className="bg-black/50 hover:bg-black/70 p-2 rounded-full text-white hover:scale-110 transition-all duration-200 ease-out"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Header */}
              <h3 className="pr-12 font-semibold text-lg">
                {selectedImage.title}
              </h3>
            </CardHeader>
            {/* Image container with responsive aspect ratio */}
            <CardContent className="relative bg-gray-50 p-2 rounded-b-xl w-full min-w-[300px] max-w-[800px] aspect-[4/3] overflow-hidden">
              <Image
                src={selectedImage.url}
                alt={selectedImage.title}
                fill
                className="rounded-lg object-contain"
                priority
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
