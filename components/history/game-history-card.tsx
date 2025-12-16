"use client";

import { AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
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
    _id: Id<"games">;
    code: string;
    category: string;
    status: "waiting" | "started" | "finished";
    created_at: number;
    round: number;
    max_rounds: number;
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

  // Fetch turns and players for this game
  const turns =
    useQuery(api.queries.history.getGameTurnsWithDetails, {
      game_id: game._id,
    }) ?? [];

  const players =
    useQuery(api.queries.history.getGamePlayers, {
      game_id: game._id,
    }) ?? [];

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
    }, 300);
  };

  const gameWinner = useMemo(() => {
    if (players.length === 0) {
      return null;
    }

    // Find player with highest score
    return players.reduce((winner, player) => {
      if (!winner || player.score > winner.score) {
        return {
          username: player.username,
          avatar_url: player.avatar_url,
          score: player.score,
        };
      }
      return winner;
    }, null as { username: string; avatar_url?: string; score: number } | null);
  }, [players]);

  const turnsCount = turns.length;

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
                {turnsCount} turni
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
                  <div className="flex flex-shrink-0 justify-center items-center bg-slate-200 rounded-full w-6 h-6">
                    {gameWinner.avatar_url ? (
                      <Image
                        src={gameWinner.avatar_url}
                        alt={gameWinner.username}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="font-semibold text-xs">
                        {gameWinner.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {gameWinner.username}
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
        {turns.length > 0 ? (
          <div className="space-y-3">
            <h4 className="mb-4 font-semibold text-sm">Turni della partita:</h4>
            <div className="gap-3 grid overflow-y-auto">
              {turns.map((turn, index) => (
                <div
                  key={turn._id}
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
                        {turn.card_word}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {turn.points_awarded} punti
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <span>Disegnato da</span>
                        <div className="flex flex-shrink-0 justify-center items-center bg-slate-200 rounded-full w-4 h-4">
                          {turn.drawer_avatar_url ? (
                            <Image
                              src={turn.drawer_avatar_url}
                              alt={turn.drawer_username}
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="font-semibold text-[10px]">
                              {turn.drawer_username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">
                          {turn.drawer_username}
                        </span>
                      </div>
                      {turn.winner_id ? (
                        <div className="flex items-center gap-1">
                          <span>Vinto da</span>
                          <div className="flex flex-shrink-0 justify-center items-center bg-slate-200 rounded-full w-4 h-4">
                            {turn.winner_avatar_url ? (
                              <Image
                                src={turn.winner_avatar_url}
                                alt={turn.winner_username || "Winner"}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="font-semibold text-[10px]">
                                {turn.winner_username
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            {turn.winner_username}
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

                  {turn.drawing_file_id && (
                    <div className="flex-shrink-0">
                      <div
                        className="relative bg-white hover:shadow-lg border rounded-lg w-16 h-16 overflow-hidden hover:scale-110 transition-all duration-200 ease-out cursor-pointer transform"
                        onClick={(e) =>
                          openImageModal(
                            "", // Would need to get URL from storage
                            turn.card_word,
                            e.currentTarget
                          )
                        }
                      >
                        <span className="text-muted-foreground text-xs">
                          Drawing
                        </span>
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
              {selectedImage.url ? (
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  className="rounded-lg object-contain"
                  priority
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <span className="text-muted-foreground">
                    Drawing not available
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
