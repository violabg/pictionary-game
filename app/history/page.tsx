import GameHistoryCard from "@/components/history/game-history-card";
import HistoryFilters from "@/components/history/history-filters";
import HistoryPagination from "@/components/history/history-pagination";
import { createClient } from "@/lib/supabase/server";
import {
  getGameCategories,
  getGameHistory,
} from "@/lib/supabase/supabase-turns";
import { Suspense } from "react";

interface SearchParams {
  category?: string;
  page?: string;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user;

  if (!user) {
    return (
      <main className="flex-1 py-8 container">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl">Game History</h1>
          <p>Please log in to view your game history.</p>
        </div>
      </main>
    );
  }

  const category = searchParams.category;
  const page = Number(searchParams.page) || 1;

  try {
    const [gameHistoryData, categories] = await Promise.all([
      getGameHistory(user.id, page, 10, category),
      getGameCategories(),
    ]);

    const { games, total } = gameHistoryData;

    return (
      <main className="flex-1 py-8 container">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-bold text-3xl">Game History</h1>
            <p className="mt-2 text-muted-foreground">
              View your past Pictionary games and performance
            </p>
          </div>

          <Suspense fallback={<div>Loading filters...</div>}>
            <HistoryFilters
              categories={categories}
              currentCategory={category}
              currentPage={page}
            />
          </Suspense>

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
                <div className="gap-4 grid">
                  {games.map((game) => (
                    <GameHistoryCard key={game.id} game={game} />
                  ))}
                </div>

                {/* Pagination */}
                {total > 10 && (
                  <div className="mt-8">
                    <HistoryPagination
                      currentPage={page}
                      totalItems={total}
                      itemsPerPage={10}
                      category={category}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading game history:", error);
    return (
      <main className="flex-1 py-8 container">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl">Game History</h1>
          <p className="text-red-500">
            There was an error loading your game history. Please try again
            later.
          </p>
        </div>
      </main>
    );
  }
}
