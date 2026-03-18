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
    <div className="space-y-8 mx-auto py-8 max-w-4xl">
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-6 bg-card shadow-[8px_8px_0_0_var(--color-primary)] p-6 border-4 border-foreground rounded-2xl">
        <div>
          <h1 className="mb-2 font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            <span className="drop-shadow-[2px_2px_0_var(--color-foreground)] text-primary">
              Sala d&apos;attesa
            </span>
          </h1>
          <p className="font-bold text-muted-foreground text-lg">
            {lobbyMessage}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/20 shadow-[4px_4px_0_0_var(--color-primary)] p-2 border-4 border-foreground rounded-xl">
            <Badge
              variant="outline"
              className="bg-transparent px-4 py-2 border-none font-display font-black text-foreground text-2xl uppercase tracking-[0.2em]"
            >
              {game.code}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyGameCode}
              className="bg-white hover:bg-secondary dark:bg-black border-2 border-foreground hover:text-secondary-foreground transition-colors hover:-translate-y-1 active:translate-y-1"
            >
              <Copy className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-[8px_8px_0_0_var(--color-secondary)]">
        <CardHeader className="bg-secondary/10 pb-6 border-foreground border-b-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <Users className="w-8 h-8 text-secondary" />
            <span>Giocatori ({players.length})</span>
            {players.length >= 2 && (
              <Badge
                variant="default"
                className="bg-accent shadow-[2px_2px_0_0_var(--color-foreground)] ml-auto px-3 py-1 border-2 border-foreground text-lg text-accent-foreground"
              >
                Pronti
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-6 grid md:grid-cols-2 bg-[radial-gradient(var(--color-muted)_1px,transparent_1px)] p-6 [background-size:16px_16px]">
          {players.map((player, index) => (
            <div
              key={player._id}
              className={`flex items-center gap-4 p-4 bg-card border-4 border-foreground rounded-xl shadow-[4px_4px_0_0_var(--color-primary)] transform transition-transform hover:-translate-y-1 ${index % 2 === 0 ? "-rotate-1" : "rotate-1"}`}
            >
              {player.avatar_url && (
                <div className="relative">
                  <div className="hidden sm:block absolute inset-0 bg-primary border-2 border-foreground rounded-full translate-x-1 translate-y-1"></div>
                  <img
                    src={player.avatar_url}
                    alt={player.username}
                    className="z-10 relative bg-white border-4 border-foreground rounded-full w-14 h-14 object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-display font-bold text-xl truncate uppercase tracking-wide">
                  {player.username}
                </p>
                <p className="font-bold text-muted-foreground text-sm">
                  Punti: <span className="text-secondary">{player.score}</span>
                </p>
              </div>
              {player.is_host && (
                <Badge className="bg-primary shadow-[2px_2px_0_0_var(--color-foreground)] border-2 border-foreground text-primary-foreground">
                  Host
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {isHost && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <Button
            size="lg"
            variant="default"
            onClick={onStartGame}
            disabled={players.length < 2 || isStartingGame}
            className="shadow-[6px_6px_0_0_var(--color-primary)] hover:shadow-[8px_8px_0_0_var(--color-primary)] active:shadow-[2px_2px_0_0_var(--color-primary)] py-8 w-full max-w-md text-2xl"
          >
            {isStartingGame ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                Avvio in corso...
              </span>
            ) : players.length < 2 ? (
              "In attesa giocatori..."
            ) : (
              "Inizia la Partita!"
            )}
          </Button>
          {players.length < 2 && (
            <p className="bg-card shadow-[4px_4px_0_0_var(--color-primary)] px-6 py-3 border-4 border-foreground rounded-xl font-bold text-lg text-center -rotate-1">
              Condividi il codice{" "}
              <span className="px-2 font-display font-black text-primary text-xl">
                {game.code}
              </span>{" "}
              con gli amici per iniziare!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
