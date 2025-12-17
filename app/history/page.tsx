"use client";

import GameHistoryCard from "@/components/history/game-history-card";
import HistoryFilters from "@/components/history/history-filters";
import HistoryPagination from "@/components/history/history-pagination";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedUser } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page")) || 1;

  const { profile, isLoading: authLoading } = useAuthenticatedUser();

  // Get categories
  const categories = useQuery(api.queries.history.getUserGameCategories) ?? [];

  // Get total count for pagination
  const totalCount = useQuery(
    api.queries.history.getUserGameCount,
    category && category !== "all" ? { category } : {}
  );

  // Calculate cursor based on page number
  const cursor = page > 1 ? ((page - 1) * ITEMS_PER_PAGE).toString() : null;

  // Get games for current page
  const historyData = useQuery(api.queries.history.getUserGameHistory, {
    paginationOpts: {
      numItems: ITEMS_PER_PAGE,
      cursor,
    },
    category: category && category !== "all" ? category : undefined,
  });
  console.log("historyData", historyData);
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
  const isLoadingGames = historyData === undefined;

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
          {isLoadingGames ? (
            <div className="space-y-4">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card shadow-sm border rounded-lg h-[94px] overflow-hidden"
                >
                  <div className="px-6 py-4">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-5 h-5" />
                          <Skeleton className="w-32 h-6" />
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="w-32 h-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="w-16 h-4" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="rounded-full w-20 h-6" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="rounded-full w-6 h-6" />
                          <Skeleton className="w-16 h-4" />
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="w-8 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : games.length === 0 ? (
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

              {/* Pagination */}
              {totalCount !== undefined && totalCount > ITEMS_PER_PAGE && (
                <div className="mt-8">
                  <HistoryPagination
                    currentPage={page}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    category={category ?? undefined}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
