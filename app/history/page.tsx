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
        <div className="mb-12 text-center">
          <h1 className="drop-shadow-[4px_4px_0_var(--color-primary)] dark:drop-shadow-[4px_4px_0_var(--color-primary)] font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight">
            Storico Partite
          </h1>
          <p className="inline-block bg-white dark:bg-black shadow-[4px_4px_0px_0px_var(--color-foreground)] dark:shadow-[4px_4px_0px_0px_var(--color-foreground)] mx-auto mt-4 p-4 border-4 border-foreground rounded-xl max-w-2xl font-bold text-xl">
            Rivivi le tue sfide e le tue performance
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
          className="bg-card shadow-[8px_8px_0_0_var(--color-primary)] border-4 border-foreground rounded-2xl h-23.5 overflow-hidden"
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
