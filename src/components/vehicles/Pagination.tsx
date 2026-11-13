import React from "react";
import Link from "next/link";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val !== undefined && key !== "page") {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val);
        }
      }
    }
    params.set("page", String(pageNumber));
    return `/vehicles?${params.toString()}`;
  };

  return (
    <nav
      role="navigation"
      aria-label="Vehicle Inventory Pagination"
      className="py-12 border-t border-[var(--border-hairline)] flex items-center justify-between"
    >
      {/* Previous Page Link */}
      <div>
        {hasPrev ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="inline-flex items-center min-h-[44px] px-5 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
          >
            &larr; Previous Page
          </Link>
        ) : (
          <span className="inline-flex items-center min-h-[44px] px-5 rounded-[2px] border border-[var(--border-hairline)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-muted)] opacity-40 cursor-not-allowed">
            &larr; Previous Page
          </span>
        )}
      </div>

      {/* Page Count */}
      <div className="text-xs font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        Page <span className="font-serif text-sm font-semibold text-[var(--text-primary)]">{currentPage}</span> of{" "}
        <span className="font-serif text-sm font-semibold text-[var(--text-primary)]">{totalPages}</span>
      </div>

      {/* Next Page Link */}
      <div>
        {hasNext ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="inline-flex items-center min-h-[44px] px-5 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
          >
            Next Page &rarr;
          </Link>
        ) : (
          <span className="inline-flex items-center min-h-[44px] px-5 rounded-[2px] border border-[var(--border-hairline)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-muted)] opacity-40 cursor-not-allowed">
            Next Page &rarr;
          </span>
        )}
      </div>
    </nav>
  );
}

