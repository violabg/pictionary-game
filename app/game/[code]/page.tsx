"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { use } from "react";
import { GameClientPage } from "./GameClientPage";

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const game = useQuery(
    api.queries.games.getGameByCode,
    code ? { code } : "skip",
  );

  if (game === undefined) {
    return (
      <main className="flex flex-col flex-1 justify-center items-center py-8 container">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex flex-col flex-1 justify-center items-center py-12 min-h-[calc(100vh-64px)] container">
        <div className="bg-card shadow-[8px_8px_0_0_var(--color-destructive)] p-8 border-4 border-foreground rounded-2xl w-full max-w-md text-center -rotate-2">
          <h1 className="mb-6 font-display font-black text-destructive text-4xl uppercase tracking-tight">
            Partita non trovata
          </h1>
          <p className="mb-8 font-bold text-foreground text-lg">
            Il codice potrebbe essere errato o la partita è scaduta.
          </p>
          <a
            href="/gioca"
            className="block bg-secondary shadow-[4px_4px_0_0_var(--color-secondary)] hover:shadow-[6px_6px_0_0_var(--color-secondary)] active:shadow-none py-4 border-4 border-foreground rounded-xl font-display font-black text-secondary-foreground text-xl text-center uppercase tracking-widest transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1"
          >
            Torna alla Lobby
          </a>
        </div>
      </main>
    );
  }

  return <GameClientPage gameId={game._id} code={game.code} />;
}
