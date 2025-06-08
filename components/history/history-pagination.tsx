"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Route } from "next";

interface HistoryPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  category?: string;
}

export default function HistoryPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  category,
}: HistoryPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Don't show pagination if there's only one page or less
  if (totalPages <= 1) return null;

  const createUrl = (page: number): Route => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (category && category !== "all") {
      params.set("category", category);
    }
    return `/history?${params.toString()}` as Route;
  };

  const getVisiblePageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate range around current page
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page if not in range
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push("ellipsis-start");
      }
    }

    // Add main range
    rangeWithDots.push(...range);

    // Add last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push("ellipsis-end");
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePageNumbers();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Pagination>
      <PaginationContent>
        {hasPrevious && (
          <PaginationItem>
            <PaginationPrevious href={createUrl(currentPage - 1)} />
          </PaginationItem>
        )}

        {visiblePages.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const pageNumber = page as number;
          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={createUrl(pageNumber)}
                isActive={pageNumber === currentPage}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {hasNext && (
          <PaginationItem>
            <PaginationNext href={createUrl(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
