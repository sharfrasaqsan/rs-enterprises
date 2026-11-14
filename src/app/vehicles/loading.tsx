import React from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { VehiclesListSkeleton } from "@/components/vehicles/VehiclesListSkeleton";

export default function VehiclesLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 sm:py-16 lg:py-20">
      <Container size="wide">
        <div className="space-y-8 sm:space-y-12">
          {/* Header Skeleton */}
          <div className="space-y-3 pb-8 border-b border-[var(--border-hairline)]">
            <Skeleton className="w-56 h-3" />
            <Skeleton className="w-96 max-w-full h-10" />
            <Skeleton className="w-2/3 max-w-2xl h-4" />
          </div>

          {/* List Skeleton */}
          <VehiclesListSkeleton />
        </div>
      </Container>
    </div>
  );
}

