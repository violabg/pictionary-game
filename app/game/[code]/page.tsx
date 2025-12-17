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
    code ? { code } : "skip"
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
      <main className="flex flex-col flex-1 justify-center items-center py-8 container">
        <h1 className="mb-4 font-bold text-2xl">Partita non trovata</h1>
        <a href="/gioca" className="btn btn-primary">
          Torna alla creazione del gioco
        </a>
      </main>
    );
  }

  return <GameClientPage gameId={game._id} code={game.code} />;
}
