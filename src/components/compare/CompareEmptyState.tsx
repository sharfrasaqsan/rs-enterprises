import React from "react";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Vehicle } from "@/types/vehicle";
import { VehicleImage } from "@/components/ui/VehicleImage";

export function CompareEmptyState({
  singleVehicle,
}: {
  singleVehicle?: Vehicle | null;
}) {
  return (
    <div className="py-20 sm:py-28 text-center max-w-xl mx-auto space-y-6">
      <div className="space-y-3">
        <Eyebrow>Vehicle Comparison Engine</Eyebrow>
        <Heading level={2}>
          {singleVehicle
            ? "Select a Second Vehicle to Compare"
            : "No Vehicles Selected for Comparison"}
        </Heading>
        <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
          {singleVehicle
            ? `You have selected the ${singleVehicle.year} ${singleVehicle.make} ${singleVehicle.model}. Browse our showroom stock to select at least one more vehicle to compare side by side.`
            : "You can compare up to 3 vehicles side by side across specifications, Japanese auction grades, mileage, and showroom pricing."}
        </p>
      </div>

      {singleVehicle && (
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] max-w-sm mx-auto text-left flex items-center space-x-4">
          <div className="relative w-24 h-16 shrink-0 overflow-hidden rounded-[1px]">
            <VehicleImage
              src={singleVehicle.images[0] || "/images/vehicles/sample-prado.svg"}
              alt={`${singleVehicle.year} ${singleVehicle.make} ${singleVehicle.model}`}
              aspectRatio="16/10"
            />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] block">
              1 of 3 Selected
            </span>
            <span className="font-serif text-sm font-medium text-[var(--text-primary)]">
              {singleVehicle.year} {singleVehicle.make} {singleVehicle.model}
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="solid" size="lg" href="/vehicles">
          Browse Showroom Stock
        </Button>
        <Button variant="outline" href="/">
          Return to Home
        </Button>
      </div>
    </div>
  );
}

