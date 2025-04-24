"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Player } from "@/lib/types";
import { useState } from "react";

interface SelectWinnerModalProps {
  players: Player[];
  onSelectWinner: (playerId: string) => void;
  onClose: () => void;
  timeRemaining: number;
}

export default function SelectWinnerModal({
  players,
  onSelectWinner,
  onClose,
  timeRemaining,
}: SelectWinnerModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSelectWinner = async (playerId: string) => {
    setLoading(true);
    try {
      await onSelectWinner(playerId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="gradient-border sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            Seleziona Vincitore
          </DialogTitle>
          <DialogDescription>
            Scegli il giocatore che ha indovinato correttamente
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-center">
            Punti da assegnare:{" "}
            <span className="font-bold gradient-text">{timeRemaining}</span>
          </p>
          <div className="space-y-2">
            {players.length > 0 ? (
              players.map((player) => (
                <Button
                  key={player.id}
                  variant="glass"
                  className="justify-start w-full text-left"
                  onClick={() => handleSelectWinner(player.id)}
                  disabled={loading}
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{player.username}</span>
                    <span className="text-muted-foreground text-sm">
                      Punteggio attuale: {player.score}
                    </span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-center">
                Nessun giocatore disponibile
              </p>
            )}
          </div>
          {loading && (
            <div className="flex justify-center pt-2">
              <span className="from-pink-500 to-yellow-500 border-2 border-gradient-to-r border-t-transparent rounded-full w-6 h-6 animate-spin"></span>
              <span className="ml-2 text-muted-foreground">
                Invio in corso...
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annulla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
