import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Vehicle, ImportStage } from "@/types/vehicle";

interface StageConfig {
  key: ImportStage;
  label: string;
}

const STAGES: StageConfig[] = [
  { key: "japan_auction", label: "Tokyo Auction" },
  { key: "in_transit", label: "Vessel In Transit" },
  { key: "customs_clearing", label: "Port Clearing" },
  { key: "in_stock", label: "Showroom Ready" },
];

export function IncomingBand({
  incomingVehicles,
}: {
  incomingVehicles: Vehicle[];
}) {
  if (!incomingVehicles || incomingVehicles.length === 0) return null;

  const getStageIndex = (stage: ImportStage): number => {
    switch (stage) {
      case "japan_auction":
        return 0;
      case "in_transit":
        return 1;
      case "customs_clearing":
        return 2;
      case "in_stock":
        return 3;
      default:
        return 1;
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-surface)] border-y border-[var(--border-hairline)]">
      <Container size="wide">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="reveal-on-scroll flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]">
            <div className="space-y-2">
              <Eyebrow>Logistics Pipeline &bull; Open for Pre-Order</Eyebrow>
              <Heading level={2}>
                In-Transit Japanese Stock
              </Heading>
            </div>
            <Link
              href="/incoming"
              className="link-underline text-xs font-sans uppercase font-medium tracking-[0.18em] text-[var(--accent)] transition-colors self-start sm:self-auto min-h-[44px] inline-flex items-center"
            >
              Explore Full Pipeline &rarr;
            </Link>
          </div>

          {/* Incoming Vehicle Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {incomingVehicles.map((vehicle, idx) => {
              const currentStageIndex = getStageIndex(vehicle.importStage);

              return (
                <div
                  key={vehicle.id}
                  className={`reveal-on-scroll stagger-${idx + 1} bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-8 space-y-6 flex flex-col justify-between`}
                >
                  <div className="space-y-6">
                    {/* Header Row */}
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[var(--status-incoming)]">
                        &bull; IN TRANSIT FROM JAPAN
                      </span>
                      {vehicle.expectedArrival && (
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          ETA: {vehicle.expectedArrival}
                        </span>
                      )}
                    </div>

                    {/* Image & Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-5">
                        <VehicleImage
                          src={vehicle.images[0] || "/images/vehicles/vezel-hybrid.jpg"}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          aspectRatio="16/10"
                        />
                      </div>
                      <div className="sm:col-span-7 space-y-2">
                        <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-wider">
                          Grade {vehicle.grade}
                        </span>
                        <Heading level={3} className="line-clamp-1">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Heading>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-light">
                          {vehicle.description}
                        </p>
                      </div>
                    </div>

                    {/* Refined Import-Stage Indicator */}
                    <div className="pt-2">
                      <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
                        Logistics Progress
                      </div>

                      <div className="grid grid-cols-4 gap-2 relative">
                        {STAGES.map((stg, sIdx) => {
                          const isComplete = sIdx < currentStageIndex;
                          const isCurrent = sIdx === currentStageIndex;

                          return (
                            <div key={stg.label} className="space-y-1.5 text-center">
                              {/* Horizontal Bar segment */}
                              <div
                                className={`h-1 w-full rounded-[1px] transition-colors ${
                                  isComplete
                                    ? "bg-[var(--accent)]"
                                    : isCurrent
                                    ? "bg-[var(--status-incoming)]"
                                    : "bg-[var(--border-hairline)]"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-sans uppercase tracking-wider block ${
                                  isCurrent
                                    ? "text-[var(--text-primary)] font-semibold"
                                    : isComplete
                                    ? "text-[var(--accent)]"
                                    : "text-[var(--text-muted)]"
                                }`}
                              >
                                {stg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Reservation CTA */}
                  <div className="pt-6 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      {vehicle.price ? (
                        <Numeral
                          value={vehicle.price.toLocaleString("en-US")}
                          prefix="LKR"
                          label="Pre-Order Price Protection"
                          size="sm"
                        />
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-sm font-sans uppercase tracking-wider font-medium text-[var(--accent)] block">
                            Call For Price
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                            Duty concession available
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                      <WhatsAppButton
                        label="Reserve Vessel"
                        vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model} (Incoming)`}
                        className="w-full sm:w-auto"
                      />
                      <Link
                        href={`/vehicles/${vehicle.slug}`}
                        className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
                      >
                        Specs
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

