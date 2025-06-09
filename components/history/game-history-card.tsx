"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnWithDetails } from "@/lib/supabase/types";
import { format } from "date-fns";
import { Calendar, Crown, Trophy, Users, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

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

  const totalScore = useMemo(
    () =>
      game.total_turns.reduce(
        (acc, turn) => acc + (turn.points_awarded || 0),
        0
      ),
    [game.total_turns]
  );

  return (
    <>
      <Card className="mb-4 w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 font-bold text-lg">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Partita #{game.code}
              </CardTitle>
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
              <Badge variant="secondary">{game.category}</Badge>
              <div className="text-right">
                <div className="font-bold text-primary text-2xl">
                  {totalScore}
                </div>
                <div className="text-muted-foreground text-xs">
                  punti totali
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {game.total_turns.length > 0 ? (
            <div className="space-y-3">
              <h4 className="mb-3 font-semibold text-sm">
                Turni della partita:
              </h4>
              <div className="gap-3 grid max-h-96 overflow-y-auto">
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
                        Disegnato da{" "}
                        <span className="font-medium">
                          {turn.drawer.name || turn.drawer.user_name}
                        </span>
                        {" • "}
                        {turn.winner ? (
                          <>
                            Vinto da{" "}
                            <span className="flex items-center gap-1 font-medium">
                              <Crown className="w-3 h-3 text-yellow-500" />
                              {turn.winner.name || turn.winner.user_name}
                            </span>
                          </>
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
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          }`}
          onClick={closeImageModal}
        >
          <Card
            ref={modalRef}
            className="relative p-[2px] pt-8 gradient-border glass-card"
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
                    }px) scale(${selectedImage.thumbnailRect.width / 600})`
                  : isClosing && selectedImage.thumbnailRect
                  ? `translate(${
                      selectedImage.thumbnailRect.left +
                      selectedImage.thumbnailRect.width / 2 -
                      window.innerWidth / 2
                    }px, ${
                      selectedImage.thumbnailRect.top +
                      selectedImage.thumbnailRect.height / 2 -
                      window.innerHeight / 2
                    }px) scale(${selectedImage.thumbnailRect.width / 600})`
                  : "translate(0, 0) scale(1)",
              transition: isClosing
                ? "transform 300ms cubic-bezier(0.4, 0.0, 1, 1)"
                : "transform 300ms cubic-bezier(0.0, 0.0, 0.2, 1)",
            }}
          >
            <CardHeader className="relativeoverflow-hidden">
              {/* Close button */}
              <div className="top-4 right-4 z-10 absolute">
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
            {/* Image container with fixed aspect ratio */}
            <CardContent className="relative bg-gray-50 p-2 w-[600px] h-[450px]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.title}
                fill
                className="object-contain"
                priority
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
