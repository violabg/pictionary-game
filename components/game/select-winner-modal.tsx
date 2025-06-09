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
import { GameWithPlayers, PlayerWithProfile } from "@/lib/supabase/types";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface SelectWinnerModalProps {
  players: GameWithPlayers["players"];
  onSelectWinner: (player: PlayerWithProfile) => void;
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

  const handleSelectWinner = async (player: PlayerWithProfile) => {
    setLoading(true);
    try {
      await onSelectWinner(player);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="gradient-border sm:max-w-md glass-card">
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
                  className="justify-start w-full h-auto text-left"
                  onClick={() => handleSelectWinner(player)}
                  disabled={loading}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex justify-start items-center gap-2 w-full">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={player.profile.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {getInitials(player.profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{player.profile.name}</span>
                    </div>
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
