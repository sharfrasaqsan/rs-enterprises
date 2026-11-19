"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCompareSlugs } from "@/lib/compare-storage";

export function CompareCounter({ className = "" }: { className?: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSlugs(getCompareSlugs());
      setMounted(true);
    }, 0);

    const handleUpdate = () => {
      setSlugs(getCompareSlugs());
    };

    window.addEventListener("rs_compare_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("rs_compare_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const count = mounted ? slugs.length : 0;
  const href = count > 0 ? `/compare?v=${slugs.join(",")}` : "/compare";

  return (
    <Link
      href={href}
      className={`relative inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury rounded-[2px] border ${
        count > 0
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-surface)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      } ${className}`}
      aria-label={`Compare vehicles (${count} selected)`}
      title={`Compare vehicles (${count} selected)`}
    >
      <svg
        className="w-4 h-4 stroke-current shrink-0"
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
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-mono font-bold rounded-full flex items-center justify-center shadow-sm">
          {count}
        </span>
      )}
    </Link>
  );
}

