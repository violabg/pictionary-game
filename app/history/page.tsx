"use client";

import GameHistoryCard from "@/components/history/game-history-card";
import HistoryFilters from "@/components/history/history-filters";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedUser } from "@/lib/hooks/useAuthenticatedUser";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page")) || 1;

  const { profile, isLoading: authLoading } = useAuthenticatedUser();
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: ITEMS_PER_PAGE,
    cursor: null,
  });

  // Get categories
  const categories = useQuery(api.queries.history.getUserGameCategories) ?? [];

  // Get games for current page
  const historyData = useQuery(api.queries.history.getUserGameHistory, {
    paginationOpts,
    category: category && category !== "all" ? category : undefined,
  });

  if (authLoading) {
    return (
      <main className="flex-1 py-8 container">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl">Game History</h1>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 py-8 container">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl">Game History</h1>
          <p>Please log in to view your game history.</p>
        </div>
      </main>
    );
  }

  const games = historyData?.page ?? [];
  const hasMore = !historyData?.isDone ?? false;

  return (
    <main className="flex-1 py-8 container">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-bold text-3xl">Game History</h1>
          <p className="mt-2 text-muted-foreground">
            View your past Pictionary games and performance
          </p>
        </div>

        <HistoryFilters
          categories={categories}
          currentCategory={category}
          currentPage={page}
        />

        <div className="space-y-4">
          {games.length === 0 ? (
            <div className="py-12 text-center">
              <h2 className="mb-2 font-semibold text-xl">No games found</h2>
              <p className="text-muted-foreground">
                {category && category !== "all"
                  ? `No games found in the "${category}" category.`
                  : "You haven't completed any games yet."}
              </p>
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="space-y-4 w-full">
                {games.map((game) => (
                  <AccordionItem
                    key={game._id}
                    value={game._id}
                    className="bg-card shadow-sm border rounded-lg overflow-hidden text-card-foreground"
                  >
                    <GameHistoryCard game={game} />
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Pagination info */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground">
                    Showing {games.length} games
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
