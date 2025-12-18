"use client";

import { Card } from "@/components/ui/card";
import { Award, Crown } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface TurnWinnerBannerProps {
  show: boolean;
  winner: {
    username: string;
    points: number;
  } | null;
  correctAnswer: string | null;
  onComplete?: () => void; // Called after animation completes
}

export default function TurnWinnerBanner({
  show,
  winner,
  correctAnswer,
  onComplete,
}: TurnWinnerBannerProps) {
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; rotation: number }>
  >([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!show || !winner) {
      return;
    }

    // Generate confetti pieces
    const pieces = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      rotation: Math.random() * 360,
    }));

    startTransition(() => {
      setConfetti(pieces);
    });

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      onComplete?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [show, winner, onComplete]);

  if (!show || !winner) {
    return null;
  }

  return (
    <Card className="relative bg-linear-to-r from-yellow-400 via-amber-300 to-orange-400 shadow-2xl border-2 border-yellow-500 overflow-hidden text-black">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-continuous {
          animation: spin 2s linear infinite;
        }
        @keyframes confetti-fall {
          to {
            opacity: 0;
            transform: translateY(100px);
          }
        }
        .confetti-piece {
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>

      <div className="relative p-4 text-center">
        {/* Decorative confetti elements */}
        {confetti.map((piece) => (
          <div
            key={`confetti-${piece.id}`}
            className="absolute bg-yellow-500 rounded-full w-2 h-2 confetti-piece"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: "-4px",
              marginTop: "-4px",
              transform: `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotation}deg)`,
              animationDelay: `${piece.id * 50}ms`,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative">
          <div className="flex justify-center mb-2">
            <Crown className="drop-shadow-lg w-8 h-8 text-white spin-continuous" />
          </div>

          <div className="drop-shadow-lg font-bold text-2xl">
            {winner.username}
          </div>
          <div className="drop-shadow-lg mb-1 font-normal text-xl">
            ha vinto!
          </div>

          {correctAnswer && (
            <div className="drop-shadow-md mb-2 text-sm">
              La risposta giusta:{" "}
              <span className="font-bold">&quot;{correctAnswer}&quot;</span>
            </div>
          )}

          <div className="flex justify-center items-center gap-2">
            <Award className="drop-shadow-md w-5 h-5" />
            <div className="drop-shadow-lg font-bold text-lg">
              +{winner.points} punti
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
