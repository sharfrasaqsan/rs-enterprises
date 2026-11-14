import React from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function IncomingLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 sm:py-16 pb-28">
      <Container size="wide">
        <div className="space-y-10 sm:space-y-14">
          {/* Header Skeleton */}
          <div className="space-y-3 pb-8 border-b border-[var(--border-hairline)]">
            <Skeleton className="w-56 h-3.5" />
            <Skeleton className="w-96 max-w-full h-10" />
            <Skeleton className="w-2/3 max-w-2xl h-4" />
          </div>

          {/* Stepper Skeleton */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>

          {/* Incoming Vehicle Cards Skeleton */}
          <div className="space-y-8">
            <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5">
                  <Skeleton className="w-full aspect-[16/10] rounded-[2px]" />
                </div>
                <div className="lg:col-span-7 space-y-4">
                  <Skeleton className="w-28 h-4" />
                  <Skeleton className="w-3/4 h-8" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-full h-12" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="w-40 h-11" />
                    <Skeleton className="w-32 h-11" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

