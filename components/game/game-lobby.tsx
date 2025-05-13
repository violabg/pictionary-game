"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GameWithPlayers } from "@/types/supabase";
import { Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface GameLobbyProps {
  game: GameWithPlayers;
  isDrawer: boolean;
  onStartGame: () => void;
  onLeaveGame: () => void;
  loadingState: "initializing" | "idle" | "starting";
}

export function GameLobby({
  game,
  isDrawer,
  onStartGame,
  onLeaveGame,
  loadingState,
}: GameLobbyProps) {
  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    toast.success("Codice partita copiato", {
      description:
        "Condividi questo codice con i tuoi amici per unirsi alla partita",
    });
  };

  // Trova il giocatore di turno (turn_order === 1 all'inizio, poi gestito dal game-room)
  const currentTurnPlayer = game.players.find((p) => p.order_index === 1);

  let lobbyMessage = "";
  if (game.status === "waiting") {
    lobbyMessage =
      game.players.length < game.max_players
        ? `In attesa che tutti i giocatori si uniscano (${game.players.length}/${game.max_players})...`
        : "Tutti i giocatori sono presenti. In attesa dell'host per iniziare...";
  } else if (game.status === "active") {
    lobbyMessage =
      "In attesa che venga generata la domanda da " +
      (currentTurnPlayer?.profile.user_name || "...");
  }

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
          <Button variant="destructive" onClick={onLeaveGame}>
            Esci
          </Button>
        </div>
      </div>

      <Card className="gradient-border glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            <span>
              Giocatori ({game.players.length}/{game.max_players})
            </span>
            {game.players.length === game.max_players && (
              <Badge
                variant="default"
                className="bg-gradient-to-r from-[oklch(85%_0.2_160)] to-[oklch(85%_0.3_120)] ml-2 text-[oklch(25%_0.05_240)]"
              >
                Tutti presenti
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4 grid md:grid-cols-2">
          {game.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <Avatar>
                <AvatarImage src={player.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {player.profile.user_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{player.profile.full_name}</p>
                <p className="text-muted-foreground text-sm">
                  Ordine di turno: {player.order_index}
                </p>
              </div>
              {player.player_id === game.current_drawer_id && (
                <Badge>Host</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {isDrawer && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={onStartGame}
            disabled={
              game.players.length < 2 ||
              game.players.length < game.max_players ||
              loadingState === "starting"
            }
            className="px-8"
          >
            {loadingState === "starting" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Avvio in corso...
              </span>
            ) : game.players.length < 2 ? (
              "Servono almeno 2 giocatori per iniziare"
            ) : game.players.length < game.max_players ? (
              `Attendi che tutti i giocatori si uniscano (${game.players.length}/${game.max_players})`
            ) : (
              "Inizia la partita"
            )}
          </Button>
          {game.players.length < game.max_players && (
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
