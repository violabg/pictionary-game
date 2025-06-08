"use client";

import { searchGameHistory } from "@/app/history/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { useRef, useTransition } from "react";

interface HistoryFiltersProps {
  categories: string[];
  currentCategory?: string;
  currentPage: number;
}

export default function HistoryFilters({
  categories,
  currentCategory = "all",
  currentPage,
}: HistoryFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleCategoryChange = (value: string) => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set("category", value);
      formData.set("page", "1"); // Reset to first page when changing filters

      startTransition(() => {
        searchGameHistory(formData);
      });
    }
  };

  const handleSearch = (formData: FormData) => {
    formData.set("page", "1"); // Reset to first page when searching
    startTransition(() => {
      searchGameHistory(formData);
    });
  };

  return (
    <div className="mb-6">
      <form
        ref={formRef}
        action={handleSearch}
        className="flex sm:flex-row flex-col gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select
              name="category"
              value={currentCategory}
              onValueChange={handleCategoryChange}
              disabled={isPending}
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

        <input type="hidden" name="page" value={currentPage} />

        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <div className="mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4 animate-spin" />
          ) : (
            <Search className="mr-2 w-4 h-4" />
          )}
          {isPending ? "Ricerca in corso..." : "Applica filtri"}
        </Button>
      </form>
    </div>
  );
}
