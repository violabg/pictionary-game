"use server";

import { getGameHistory } from "@/lib/supabase/supabase-turns";
import { redirect } from "next/navigation";

export async function searchGameHistory(formData: FormData) {
  const category = formData.get("category") as string;
  const page = Number(formData.get("page")) || 1;
  const currentSearchParams = new URLSearchParams();

  if (category && category !== "all") {
    currentSearchParams.set("category", category);
  }

  if (page > 1) {
    currentSearchParams.set("page", page.toString());
  }

  const queryString = currentSearchParams.toString();
  const redirectPath = queryString ? `/history?${queryString}` : "/history";

  redirect(redirectPath);
}

export async function loadMoreGames(
  userId: string,
  page: number,
  category?: string
) {
  return await getGameHistory(userId, page, 10, category);
}
