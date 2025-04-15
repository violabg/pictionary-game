"use client"

import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface SelectWinnerModalProps {
  players: Player[]
  onSelectWinner: (playerId: string) => void
  onClose: () => void
  timeRemaining: number
}

export default function SelectWinnerModal({ players, onSelectWinner, onClose, timeRemaining }: SelectWinnerModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card gradient-border">
        <DialogHeader>
          <DialogTitle className="gradient-text">Select Winner</DialogTitle>
          <DialogDescription>Choose the player who guessed correctly</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            Points to award: <span className="font-bold gradient-text">{timeRemaining}</span>
          </p>
          <div className="space-y-2">
            {players.length > 0 ? (
              players.map((player) => (
                <Button
                  key={player.id}
                  variant="glass"
                  className="w-full justify-start text-left"
                  onClick={() => onSelectWinner(player.id)}
                >
                  <div className="flex items-center w-full justify-between">
                    <span>{player.username}</span>
                    <span className="text-sm text-muted-foreground">Current score: {player.score}</span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No players available to select</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
