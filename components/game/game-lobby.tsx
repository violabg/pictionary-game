"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface GameLobbyProps {
  gameId: Id<"games">;
  game: Doc<"games">;
  players: Doc<"players">[];
  isHost: boolean;
  onStartGame: () => void;
  isStartingGame: boolean;
}

export function GameLobby({
  gameId,
  game,
  players,
  isHost,
  onStartGame,
  isStartingGame,
}: GameLobbyProps) {
  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    toast.success("Codice partita copiato", {
      description:
        "Condividi questo codice con i tuoi amici per unirsi alla partita",
    });
  };

  const lobbyMessage =
    players.length >= 2
      ? "Tutti i giocatori sono presenti. Host può avviare la partita..."
      : `In attesa dei giocatori (${players.length}/2+)...`;

  return (
    <div className="space-y-8">
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-bold text-3xl">
            <span className="text-gradient">{"Sala d'attesa"}</span>
          </h1>
          <p className="text-muted-foreground">{lobbyMessage}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 font-mono text-lg">
              {game.code}
            </Badge>
            <Button variant="ghost" size="icon" onClick={copyGameCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="gradient-border glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            <span>Giocatori ({players.length})</span>
            {players.length >= 2 && (
              <Badge
                variant="default"
                className="bg-gradient-to-r from-[oklch(85%_0.2_160)] to-[oklch(85%_0.3_120)] ml-2 text-[oklch(25%_0.05_240)]"
              >
                Pronti
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4 grid md:grid-cols-2">
          {players.map((player) => (
            <div
              key={player._id}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {player.avatar_url && (
                <img
                  src={player.avatar_url}
                  alt={player.username}
                  className="rounded-full w-10 h-10"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{player.username}</p>
                <p className="text-muted-foreground text-sm">
                  Punti: {player.score}
                </p>
              </div>
              {player.is_host && <Badge>Host</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      {isHost && (
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={onStartGame}
            disabled={players.length < 2 || isStartingGame}
            className="px-8"
          >
            {isStartingGame ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Avvio in corso...
              </span>
            ) : players.length < 2 ? (
              "Servono almeno 2 giocatori per iniziare"
            ) : (
              "Inizia la partita"
            )}
          </Button>
          {players.length < 2 && (
            <p className="text-muted-foreground text-sm">
              Condividi il codice partita{" "}
              <span className="font-mono font-bold">{game.code}</span> con gli
              amici per unirsi
            </p>
          )}
        </div>
      )}
    </div>
  );
}
