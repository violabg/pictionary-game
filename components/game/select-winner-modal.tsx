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
import { Doc } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useState } from "react";

interface SelectWinnerModalProps {
  players: Doc<"players">[];
  onSelectWinner: (player: Doc<"players">) => void;
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

  const handleSelectWinner = async (player: Doc<"players">) => {
    setLoading(true);
    try {
      await onSelectWinner(player);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient">
            Seleziona Vincitore
          </DialogTitle>
          <DialogDescription>
            Scegli il giocatore che ha indovinato correttamente
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-center">
            Punti da assegnare:{" "}
            <span className="font-bold text-gradient">{timeRemaining}</span>
          </p>
          <div className="space-y-2">
            {players.length > 0 ? (
              players.map((player) => (
                <Button
                  key={player.player_id}
                  variant="outline"
                  className="justify-start px-3 py-3 w-full h-auto overflow-hidden text-left whitespace-normal sm:whitespace-nowrap"
                  onClick={() => handleSelectWinner(player)}
                  disabled={loading}
                >
                  <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-2 w-full overflow-hidden">
                    <div className="flex justify-start items-center gap-2 max-w-full overflow-hidden">
                      {player.avatar_url ? (
                        <Image
                          src={player.avatar_url}
                          alt={player.username}
                          width={32}
                          height={32}
                          className="flex-shrink-0 rounded-full w-8 h-8"
                        />
                      ) : (
                        <div className="flex flex-shrink-0 justify-center items-center bg-slate-200 rounded-full w-8 h-8">
                          <span className="font-bold text-black text-xs">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="truncate">{player.username}</span>
                    </div>
                    <span className="font-sans text-muted-foreground text-xs sm:text-sm normal-case tracking-normal shrink-0">
                      Punti: {player.score}
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
