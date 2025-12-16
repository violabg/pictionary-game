"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";

interface HistoryFiltersProps {
  categories: string[];
  currentCategory?: string | null;
  currentPage?: number;
}

export default function HistoryFilters({
  categories,
  currentCategory = "all",
  currentPage = 1,
}: HistoryFiltersProps) {
  const router = useRouter();

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams();
    if (value && value !== "all") {
      params.set("category", value);
    }
    params.set("page", "1"); // Reset to first page when changing filters

    const query = params.toString();
    router.push(`/history${query ? `?${query}` : ""}` as any);
  };

  return (
    <div className="mb-6">
      <div className="flex sm:flex-row flex-col gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select
              value={currentCategory || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtra per categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
