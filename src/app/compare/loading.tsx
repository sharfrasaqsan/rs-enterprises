import React from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CompareLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 sm:py-16 pb-28">
      <Container size="wide">
        <div className="space-y-8 sm:space-y-12">
          {/* Header Skeleton */}
          <div className="space-y-3 pb-8 border-b border-[var(--border-hairline)]">
            <Skeleton className="w-48 h-3.5" />
            <Skeleton className="w-80 h-10" />
            <Skeleton className="w-96 max-w-full h-4" />
          </div>

          {/* Comparison Matrix Skeleton */}
          <div className="border border-[var(--border-hairline)] rounded-[2px] bg-[var(--bg-surface)] p-6 space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <Skeleton className="h-48 rounded-[2px]" />
              <Skeleton className="h-48 rounded-[2px]" />
              <Skeleton className="h-48 rounded-[2px]" />
              <Skeleton className="h-48 rounded-[2px]" />
            </div>

            <div className="space-y-3 pt-6 border-t border-[var(--border-hairline)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-6 py-2.5">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

