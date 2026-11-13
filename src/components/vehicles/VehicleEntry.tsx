import React from "react";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { VehicleCompareCheckbox } from "@/components/vehicles/VehicleCompareCheckbox";

export function VehicleEntry({ vehicle }: { vehicle: Vehicle }) {
  const isSold = vehicle.status === "sold";
  const formattedPrice = vehicle.price
    ? vehicle.price.toLocaleString("en-US")
    : null;

  return (
    <article
      className={`py-8 sm:py-12 border-t border-[var(--border-hairline)] transition-opacity ${
        isSold ? "opacity-65 grayscale-[25%]" : ""
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Visual Showcase (5 cols): Unboxed image with hairline frame */}
        <div className="md:col-span-5 relative group">
          <Link href={`/vehicles/${vehicle.slug}`} className="block">
            <VehicleImage
              src={vehicle.images[0] || "/images/vehicles/sample-prado.svg"}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              aspectRatio="16/10"
            />
          </Link>

          {/* Quick Status Tag overlay */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <StatusLabel status={vehicle.status} />
          </div>
        </div>

        {/* Editorial Specs (7 cols): Serif Headline, Small-caps specs, Light Numeral */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Year, Mileage, and Transmission in refined small caps */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              <span>{vehicle.year}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
              <span>{vehicle.mileage.toLocaleString()} KM</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
              <span>{vehicle.transmission}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
              <span className="text-[var(--accent)]">{vehicle.fuel}</span>
            </div>

            {/* Make and Model in Serif */}
            <Link href={`/vehicles/${vehicle.slug}`} className="block group">
              <Heading
                level={3}
                className="group-hover:text-[var(--accent)] transition-colors"
              >
                {vehicle.make} {vehicle.model}
              </Heading>
            </Link>

            <p className="text-xs sm:text-sm font-light text-[var(--text-secondary)] line-clamp-2 max-w-xl">
              {vehicle.description}
            </p>
          </div>

          {/* Price & Actions Row */}
          <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              {formattedPrice ? (
                <Numeral
                  value={formattedPrice}
                  prefix="LKR"
                  label={isSold ? "Delivered at Showroom Price" : "Showroom Asking Price"}
                  size="md"
                />
              ) : (
                <div className="space-y-0.5">
                  <span className="text-sm font-sans uppercase font-medium tracking-widest text-[var(--accent)]">
                    Call For Price / Inquire
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                    Japan Auction Direct CIF
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Checkbox-style quiet Compare control */}
              <VehicleCompareCheckbox
                slug={vehicle.slug}
                title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />

              {!isSold ? (
                <div className="flex gap-2">
                  <WhatsAppButton
                    vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    label="Inquire"
                  />
                  <Link
                    href={`/vehicles/${vehicle.slug}`}
                    className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
                  >
                    Dossier
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/contact?vehicle=${encodeURIComponent(vehicle.model)}`}
                  className="inline-flex items-center justify-center min-h-[48px] px-4 rounded-[2px] border border-[var(--border-hairline)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Source Similar Unit &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

