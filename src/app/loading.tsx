import React from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-20 bg-[var(--bg-base)]">
      <Container size="wide">
        <div className="max-w-4xl mx-auto space-y-8 text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--accent)]">
              RS Enterprises Showroom
            </span>
          </div>
          <Skeleton className="w-3/4 max-w-xl h-12 rounded-[2px]" />
          <Skeleton className="w-1/2 max-w-md h-4 rounded-[1px]" />
          <div className="w-full pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-[2px]" />
            <Skeleton className="h-64 rounded-[2px]" />
            <Skeleton className="h-64 rounded-[2px]" />
          </div>
        </div>
      </Container>
    </div>
  );
}

