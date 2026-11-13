import React from "react";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Numeral } from "@/components/ui/Numeral";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { VehicleCompareCheckbox } from "@/components/vehicles/VehicleCompareCheckbox";

export function FeaturedVehicleEntry({ vehicle }: { vehicle: Vehicle }) {
  const isSold = vehicle.status === "sold";
  const formattedPrice = vehicle.price
    ? vehicle.price.toLocaleString("en-US")
    : null;

  return (
    <article className="py-12 sm:py-16 border-t-2 border-[var(--accent)] transition-opacity">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Visual Showcase (7 cols) */}
        <div className="lg:col-span-7 relative group">
          <Link href={`/vehicles/${vehicle.slug}`} className="block">
            <VehicleImage
              src={vehicle.images[0] || "/images/vehicles/sample-prado.svg"}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} Spotlight`}
              aspectRatio="16/10"
            />
          </Link>

          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <StatusLabel status={vehicle.status} />
          </div>
        </div>

        {/* Editorial Content & Expanded Spec (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <Eyebrow>Showroom Spotlight &bull; Grade {vehicle.grade}</Eyebrow>
            <Link href={`/vehicles/${vehicle.slug}`} className="block group">
              <Heading
                level={2}
                className="group-hover:text-[var(--accent)] transition-colors"
              >
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Heading>
            </Link>
            <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed line-clamp-3">
              {vehicle.description}
            </p>
          </div>

          {/* Key Features List */}
          {vehicle.features.length > 0 && (
            <div className="py-3 border-y border-[var(--border-hairline)] space-y-1">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-muted)] block">
                Highlight Equipment
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {vehicle.features.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="inline-block text-[11px] font-sans px-2.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price & Actions */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              {formattedPrice ? (
                <Numeral
                  value={formattedPrice}
                  prefix="LKR"
                  label="Available for Showroom Inspection"
                  size="lg"
                />
              ) : (
                <span className="text-base font-sans uppercase tracking-widest text-[var(--accent)]">
                  Call For Price / Inquire
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <WhatsAppButton
                vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                label="Priority WhatsApp Inquiry"
              />
              <Link
                href={`/vehicles/${vehicle.slug}`}
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
              >
                Full Dossier
              </Link>
              <VehicleCompareCheckbox
                slug={vehicle.slug}
                title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

