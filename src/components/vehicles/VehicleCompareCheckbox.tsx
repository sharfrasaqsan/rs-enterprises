"use client";

import React, { useEffect, useState } from "react";
import { getCompareSlugs, addCompareSlug, removeCompareSlug } from "@/lib/compare-storage";

export function VehicleCompareCheckbox({
  slug,
  title,
  className = "",
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsChecked(getCompareSlugs().includes(slug));
    setMounted(true);

    const handleUpdate = () => {
      setIsChecked(getCompareSlugs().includes(slug));
    };

    window.addEventListener("rs_compare_updated", handleUpdate);
    return () => window.removeEventListener("rs_compare_updated", handleUpdate);
  }, [slug]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isChecked) {
      removeCompareSlug(slug);
      setNotice(null);
    } else {
      const current = getCompareSlugs();
      if (current.length >= 3) {
        setNotice("Max 3 vehicles limit");
        setTimeout(() => setNotice(null), 3000);
        return;
      }
      addCompareSlug(slug);
      setNotice(null);
    }
  };

  const active = mounted && isChecked;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={active}
        aria-label={`Compare ${title}`}
        onClick={handleToggle}
        className="inline-flex items-center min-h-[44px] min-w-[44px] px-2.5 py-1.5 text-[11px] font-sans uppercase tracking-[0.16em] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-luxury cursor-pointer select-none group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <span
          className={`w-4 h-4 mr-2 rounded-[1px] border transition-colors flex items-center justify-center shrink-0 ${
            active
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] group-hover:border-[var(--accent)]"
          }`}
        >
          {active && (
            <svg
              className="w-3 h-3 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className={active ? "text-[var(--accent)] font-semibold" : ""}>
          {active ? "Comparing" : "Compare"}
        </span>
      </button>

      {notice && (
        <span className="absolute -top-7 left-0 bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-mono px-2 py-0.5 rounded-[1px] whitespace-nowrap shadow-none animate-in fade-in duration-150 z-20">
          {notice}
        </span>
      )}
    </div>
  );
}

