import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import HistoryFilters from "./history-filters";

interface CategoriesFilterProps {
  category?: string;
}

export default async function CategoriesFilter({
  category,
}: CategoriesFilterProps) {
  const categories = await fetchQuery(
    api.queries.history.getUserGameCategories,
    {},
    { token: await convexAuthNextjsToken() }
  );

  return (
    <HistoryFilters categories={categories || []} currentCategory={category} />
  );
}
