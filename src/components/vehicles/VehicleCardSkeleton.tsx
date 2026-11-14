import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function VehicleCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="my-6 p-6 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Image Skeleton */}
          <div className="lg:col-span-7 relative">
            <Skeleton className="w-full aspect-[16/10] rounded-[2px]" />
            <div className="absolute top-4 left-4 flex gap-2">
              <Skeleton className="w-20 h-6 rounded-[1px]" />
              <Skeleton className="w-24 h-6 rounded-[1px]" />
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <Skeleton className="w-48 h-3 rounded-[1px]" />
              <Skeleton className="w-3/4 h-9 rounded-[2px]" />
              <div className="space-y-2 pt-2">
                <Skeleton className="w-full h-4 rounded-[1px]" />
                <Skeleton className="w-5/6 h-4 rounded-[1px]" />
              </div>
            </div>

            <div className="py-4 border-y border-[var(--border-hairline)] space-y-2">
              <Skeleton className="w-32 h-3" />
              <div className="flex gap-2">
                <Skeleton className="w-24 h-6" />
                <Skeleton className="w-28 h-6" />
                <Skeleton className="w-20 h-6" />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Skeleton className="w-40 h-8" />
              <div className="flex gap-4">
                <Skeleton className="w-36 h-12" />
                <Skeleton className="w-32 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Thumbnail Skeleton */}
        <div className="md:col-span-5 relative">
          <Skeleton className="w-full aspect-[16/10] rounded-[2px]" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-16 h-5" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-12 h-3" />
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-16 h-3" />
          </div>

          <Skeleton className="w-2/3 h-7" />

          <div className="space-y-2">
            <Skeleton className="w-full h-3.5" />
            <Skeleton className="w-4/5 h-3.5" />
          </div>

          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-4">
            <Skeleton className="w-36 h-7" />
            <div className="flex gap-3">
              <Skeleton className="w-28 h-10" />
              <Skeleton className="w-24 h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

