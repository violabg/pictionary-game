import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import HistoryFilters from "./history-filters";

export default async function CategoriesFilter() {
  const categories = await fetchQuery(
    api.queries.history.getUserGameCategories
  );

  return <HistoryFilters categories={categories} currentCategory={undefined} />;
}
