"use client";

import React, { useEffect, useState } from "react";
import { getCompareSlugs, toggleCompareSlug } from "@/lib/compare-storage";

export interface CompareButtonProps {
  slug: string;
  className?: string;
  compact?: boolean;
}

export function CompareButton({
  slug,
  className = "",
  compact = false,
}: CompareButtonProps) {
  const [isCompared, setIsCompared] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsCompared(getCompareSlugs().includes(slug));
    setMounted(true);

    const handleUpdate = () => {
      setIsCompared(getCompareSlugs().includes(slug));
    };

    window.addEventListener("rs_compare_updated", handleUpdate);
    return () => window.removeEventListener("rs_compare_updated", handleUpdate);
  }, [slug]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompareSlug(slug);
  };

  const active = mounted && isCompared;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-sans uppercase font-medium tracking-[0.14em] rounded-[2px] transition-luxury cursor-pointer border ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      } ${className}`}
    >
      <svg
        className={`w-3.5 h-3.5 stroke-current ${compact ? "" : "mr-1.5"} shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 3h5v5" />
        <path d="M4 20L21 3" />
        <path d="M21 16v5h-5" />
        <path d="M15 15l6 6" />
        <path d="M4 4l5 5" />
      </svg>
      {!compact && <span>{active ? "Compared" : "Compare"}</span>}
    </button>
  );
}

