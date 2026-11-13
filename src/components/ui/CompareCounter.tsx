"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCompareSlugs } from "@/lib/compare-storage";

export function CompareCounter({ className = "" }: { className?: string }) {
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

  const count = mounted ? slugs.length : 0;
  const href = count > 0 ? `/compare?v=${slugs.join(",")}` : "/compare";

  return (
    <Link
      href={href}
      className={`inline-flex items-center min-h-[44px] px-3 py-2 text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury rounded-[2px] border ${
        count > 0
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-surface)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      } ${className}`}
      aria-label={`Compare vehicles (${count} selected)`}
    >
      <svg
        className="w-3.5 h-3.5 mr-2 stroke-current shrink-0"
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
      <span>Compare</span>
      {count > 0 && (
        <span className="ml-1.5 px-1.5 py-0.2 bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-mono font-bold rounded-[1px] leading-tight">
          {count}
        </span>
      )}
    </Link>
  );
}

