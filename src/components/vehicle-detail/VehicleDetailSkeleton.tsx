import React from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export function VehicleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-24">
      {/* Top Header Skeleton */}
      <div className="pt-8 sm:pt-12 pb-6 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <Container size="wide">
          <div className="space-y-4">
            <Skeleton className="w-48 h-3.5" />
            <div className="flex gap-3">
              <Skeleton className="w-20 h-5" />
              <Skeleton className="w-24 h-5" />
            </div>
            <Skeleton className="w-3/4 max-w-2xl h-12" />
          </div>
        </Container>
      </div>

      {/* Main Dossier Grid */}
      <div className="pt-8 sm:pt-12">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (7 cols): Gallery & Technical Dossier */}
            <div className="lg:col-span-7 space-y-10">
              {/* Gallery Skeleton */}
              <div className="space-y-4">
                <Skeleton className="w-full aspect-[16/10] rounded-[2px]" />
                <div className="grid grid-cols-5 gap-3">
                  <Skeleton className="aspect-[4/3] rounded-[1px]" />
                  <Skeleton className="aspect-[4/3] rounded-[1px]" />
                  <Skeleton className="aspect-[4/3] rounded-[1px]" />
                  <Skeleton className="aspect-[4/3] rounded-[1px]" />
                  <Skeleton className="aspect-[4/3] rounded-[1px]" />
                </div>
              </div>

              {/* Technical Summary Matrix */}
              <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-6">
                <Skeleton className="w-36 h-3" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              </div>

              {/* Two-Column Specifications Hairline List */}
              <div className="space-y-4">
                <Skeleton className="w-48 h-6" />
                <div className="border-t border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="py-3.5 grid grid-cols-2 gap-4">
                      <Skeleton className="w-1/2 h-3.5" />
                      <Skeleton className="w-2/3 h-3.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Side Sticky Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] space-y-6 shadow-xl">
                <Skeleton className="w-32 h-3" />
                <Skeleton className="w-3/4 h-10" />
                <div className="flex gap-3">
                  <Skeleton className="flex-1 h-12" />
                  <Skeleton className="flex-1 h-12" />
                </div>
                <div className="pt-6 border-t border-[var(--border-hairline)] space-y-4">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="w-full h-11" />
                  <Skeleton className="w-full h-11" />
                  <Skeleton className="w-full h-20" />
                  <Skeleton className="w-full h-12" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

