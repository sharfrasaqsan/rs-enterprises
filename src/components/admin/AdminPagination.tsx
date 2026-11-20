"use client";

import React from "react";

export interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemName = "items",
  className = "",
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  if (totalItems === 0) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`pt-5 pb-2 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${className}`}
    >
      {/* Left: Item Range & Page Size */}
      <div className="flex items-center gap-3 text-[var(--text-secondary)] font-sans">
        <span>
          Showing{" "}
          <strong className="text-[var(--text-primary)] font-semibold font-mono">
            {startItem}–{endItem}
          </strong>{" "}
          of{" "}
          <strong className="text-[var(--text-primary)] font-semibold font-mono">
            {totalItems}
          </strong>{" "}
          {itemName}
        </span>

        {onPageSizeChange && totalItems > Math.min(...pageSizeOptions) && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[var(--border-hairline)]">
            <span className="text-[11px] text-[var(--text-muted)]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 px-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="min-h-[36px] px-3 inline-flex items-center gap-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[2px] text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 text-center text-xs text-[var(--text-muted)] select-none"
                  >
                    &hellip;
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === safePage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-h-[36px] min-w-[36px] px-2 text-xs font-mono font-medium rounded-[2px] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent)] text-stone-900 font-bold shadow-sm"
                      : "bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="min-h-[36px] px-3 inline-flex items-center gap-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[2px] text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}
