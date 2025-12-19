import CategoriesFilter from "@/components/history/categories-loader";
import HistoryContent from "@/components/history/history-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const ITEMS_PER_PAGE = 10;

export default async function HistoryPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const category = (searchParams.category as string) || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  return (
    <main className="flex-1 py-8 container">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-bold text-3xl">Game History</h1>
          <p className="mt-2 text-muted-foreground">
            View your past Pictionary games and performance
          </p>
        </div>

        <Suspense fallback={<CategoriesFilterFallback />}>
          <CategoriesFilter category={category} />
        </Suspense>

        <Suspense fallback={<HistoryContentFallback />}>
          <HistoryContent
            category={category}
            page={page}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </Suspense>
      </div>
    </main>
  );
}

function CategoriesFilterFallback() {
  return (
    <div className="mb-6">
      <div className="flex sm:flex-row flex-col gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="w-full sm:w-50 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryContentFallback() {
  return (
    <div className="space-y-4">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <div
          key={i}
          className="bg-card shadow-sm border rounded-lg h-23.5 overflow-hidden"
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
  );
}
