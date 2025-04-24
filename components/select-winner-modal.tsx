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
                  onClick={() => onSelectWinner(player.id)}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
