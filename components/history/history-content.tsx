import GameHistoryCard from "@/components/history/game-history-card";
import HistoryPagination from "@/components/history/history-pagination";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { Trophy } from "lucide-react";

interface HistoryContentProps {
  category?: string;
  page: number;
  itemsPerPage: number;
}

export default async function HistoryContent({
  category,
  page,
  itemsPerPage,
}: HistoryContentProps) {
  // Calculate cursor based on page number
  const cursor = page > 1 ? ((page - 1) * itemsPerPage).toString() : null;

  // Fetch data server-side
  const [historyData, totalCount] = await Promise.all([
    fetchQuery(
      api.queries.history.getUserGameHistory,
      {
        paginationOpts: {
          numItems: itemsPerPage,
          cursor,
        },
        category: category && category !== "all" ? category : undefined,
      },
      { token: await convexAuthNextjsToken() }
    ),
    fetchQuery(
      api.queries.history.getUserGameCount,
      category && category !== "all" ? { category } : {},
      { token: await convexAuthNextjsToken() }
    ),
  ]);

  const games = historyData?.page ?? [];

  if (games.length === 0) {
    return (
      <div className="py-12 text-center">
        <Trophy className="opacity-50 mx-auto mb-4 w-12 h-12" />
        <h2 className="mb-2 font-semibold text-xl">No games found</h2>
        <p className="text-muted-foreground">
          {category && category !== "all"
            ? `No games found in the "${category}" category.`
            : "You haven't completed any games yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4 w-full">
        {games.map((game) => (
          <AccordionItem
            key={game._id}
            value={game._id}
            className="bg-card shadow-sm border rounded-lg overflow-hidden text-card-foreground"
          >
            <GameHistoryCard
              game={{
                _id: game._id,
                code: game.code,
                category: game.category,
                status: game.status,
                created_at: game.created_at,
                round: game.round,
                max_rounds: game.max_rounds,
              }}
              turns={game.turns}
              players={game.players}
            />
          </AccordionItem>
        ))}
      </Accordion>

      {/* Pagination */}
      {totalCount !== undefined && totalCount > itemsPerPage && (
        <div className="mt-8">
          <HistoryPagination
            currentPage={page}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            category={category ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
