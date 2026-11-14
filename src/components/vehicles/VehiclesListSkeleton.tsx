import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { VehicleCardSkeleton } from "@/components/vehicles/VehicleCardSkeleton";

export function VehiclesListSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Filter Bar Skeleton */}
      <div className="p-4 sm:p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Skeleton className="h-11 rounded-[2px]" />
          <Skeleton className="h-11 rounded-[2px]" />
          <Skeleton className="h-11 rounded-[2px]" />
          <Skeleton className="h-11 rounded-[2px]" />
          <Skeleton className="h-11 rounded-[2px]" />
          <Skeleton className="h-11 rounded-[2px]" />
        </div>
      </div>

      {/* Featured Vehicle Skeleton */}
      <VehicleCardSkeleton featured={true} />

      {/* Standard Vehicle Skeletons */}
      <div className="space-y-4">
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
      </div>
    </div>
  );
}

