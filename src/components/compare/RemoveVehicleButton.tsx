"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { removeCompareSlug } from "@/lib/compare-storage";

export function RemoveVehicleButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemove = () => {
    // 1. Remove from localStorage
    removeCompareSlug(slug);

    // 2. Remove from URL search params
    const rawV = searchParams.get("v") || "";
    const remainingSlugs = rawV
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== slug);

    if (remainingSlugs.length > 0) {
      router.push(`/compare?v=${remainingSlugs.join(",")}`, { scroll: false });
    } else {
      router.push("/compare", { scroll: false });
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      aria-label={`Remove ${title} from comparison`}
      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-xs font-sans uppercase tracking-wider text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 transition-colors rounded-[1px] cursor-pointer"
    >
      <span className="text-sm mr-1">&times;</span>
      <span className="text-[10px] tracking-widest uppercase">Remove</span>
    </button>
  );
}

