"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCompareSlugs, removeCompareSlug } from "@/lib/compare-storage";

export default function CompareTray() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSlugs(getCompareSlugs());
    setMounted(true);

    const handleUpdate = () => {
      setSlugs(getCompareSlugs());
    };

    window.addEventListener("rs_compare_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("rs_compare_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!mounted || slugs.length === 0) {
    return null;
  }

  const handleClear = () => {
    try {
      localStorage.removeItem("rs_compare_vehicles");
      window.dispatchEvent(new CustomEvent("rs_compare_updated", { detail: [] }));
    } catch {
      // Ignore
    }
  };

  const compareUrl = `/compare?v=${slugs.join(",")}`;

  return (
    <div
      aria-label="Vehicle Comparison Tray"
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-md border-t border-[var(--border-subtle)] px-4 py-3 shadow-none transition-luxury animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Status & Slugs List */}
        <div className="flex items-center space-x-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
              Vehicle Comparison
            </span>
            <span className="text-xs font-serif text-[var(--text-primary)]">
              {slugs.length} of 3 Selected
            </span>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border-hairline)] shrink-0 hidden sm:block" />

          {/* Thumbnails Row */}
          <div className="flex items-center space-x-3 shrink-0">
            {slugs.map((slug) => {
              const displayTitle = slug
                .replace(/^\d{4}-/, "")
                .replace(/-/g, " ")
                .toUpperCase();

              return (
                <div
                  key={slug}
                  className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] px-2.5 py-1.5 space-x-2"
                >
                  <div className="relative w-7 h-5 overflow-hidden rounded-[1px] bg-[var(--bg-base)] shrink-0">
                    <Image
                      src="/images/vehicles/sample-prado.svg"
                      alt={slug}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-sans font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                    {displayTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCompareSlug(slug)}
                    aria-label={`Remove ${slug} from comparison`}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Actions: Clear & Compare CTA */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[44px] px-3 text-[11px] font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Clear All
          </button>

          <Link
            href={compareUrl}
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-sans text-xs uppercase font-medium tracking-[0.16em] transition-luxury focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] select-none"
          >
            <span>Compare Selected ({slugs.length})</span>
            <span className="ml-2">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

