import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { CompareButton } from "@/components/ui/CompareButton";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Button } from "@/components/ui/Button";
import { Vehicle } from "@/types/vehicle";

export function NewArrivals({ vehicles }: { vehicles: Vehicle[] }) {
  if (!vehicles || vehicles.length === 0) return null;

  const leadVehicle = vehicles[0];
  const sideVehicles = vehicles.slice(1, 3);
  const gridVehicles = vehicles.slice(3, 9);

  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-base)]">
      <Container size="wide">
        <div className="space-y-12 sm:space-y-16">
          {/* Header Row */}
          <div
            suppressHydrationWarning
            className="reveal-on-scroll flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]"
          >
            <div className="space-y-2">
              <Eyebrow>Latest Stock</Eyebrow>
              <Heading level={2}>
                Recent Japanese Arrivals
              </Heading>
            </div>
            <Link
              href="/vehicles"
              className="link-underline text-xs font-sans uppercase font-medium tracking-[0.22em] text-[var(--accent)] transition-colors self-start sm:self-auto min-h-[44px] inline-flex items-center"
            >
              View Complete Showroom Inventory &rarr;
            </Link>
          </div>

          {/* Asymmetric 12-Column Composition */}
          <div
            suppressHydrationWarning
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
          >
            {/* Major Feature Article: 7 Columns */}
            {leadVehicle && (
              <article
                suppressHydrationWarning
                className="reveal-on-scroll stagger-1 lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-9 space-y-6 shadow-xl transition-all duration-500 hover:border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <StatusLabel status={leadVehicle.status} />
                    <span className="px-2.5 py-0.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] rounded-[1px]">
                      {leadVehicle.grade}
                    </span>
                  </div>
                  <CompareButton slug={leadVehicle.slug} />
                </div>

                <Link
                  href={`/vehicles/${leadVehicle.slug}`}
                  className="block group overflow-hidden rounded-[2px] border border-[var(--border-hairline)]"
                  style={{ viewTransitionName: `vehicle-thumb-${leadVehicle.slug}` }}
                >
                  <VehicleImage
                    src={leadVehicle.images[0] || "/images/vehicles/prado-black.jpg"}
                    alt={`${leadVehicle.year} ${leadVehicle.make} ${leadVehicle.model}`}
                    aspectRatio="16/10"
                  />
                </Link>

                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.2em]">
                    ✦ {leadVehicle.grade} {leadVehicle.verified ? "• Auction Sheet Verified" : "• Japanese Specification"}
                  </div>
                  <Link href={`/vehicles/${leadVehicle.slug}`} className="block group">
                    <Heading level={3} className="group-hover:text-[var(--accent)] transition-colors">
                      {leadVehicle.year} {leadVehicle.make} {leadVehicle.model}
                    </Heading>
                  </Link>
                  <p className="text-sm font-light text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {leadVehicle.description}
                  </p>
                </div>

                {/* 4-Item Spec Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[var(--border-hairline)]">
                  <Numeral value={leadVehicle.mileage.toLocaleString("en-US")} suffix="km" label="Mileage" size="sm" />
                  <Numeral value={leadVehicle.engineCC.toLocaleString("en-US")} suffix="cc" label="Displacement" size="sm" />
                  <Numeral value={leadVehicle.fuel} label="Fuel System" size="sm" />
                  <Numeral value={leadVehicle.transmission} label="Transmission" size="sm" />
                </div>

                {/* Price and Action CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {leadVehicle.price ? (
                      <Numeral
                        value={leadVehicle.price.toLocaleString("en-US")}
                        prefix="LKR"
                        label={
                          leadVehicle.branch === "trincomalee"
                            ? "Available at Trincomalee Branch"
                            : "Available at Kaduruwela Showroom"
                        }
                        size="md"
                      />
                    ) : (
                      <span className="text-sm font-sans uppercase font-medium tracking-widest text-[var(--accent)]">
                        Call For Price / Inquire
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <WhatsAppButton
                      vehicleTitle={`${leadVehicle.year} ${leadVehicle.make} ${leadVehicle.model}`}
                      label="Inquire"
                      size="md"
                    />
                    <Button
                      variant="outline"
                      size="md"
                      href={`/vehicles/${leadVehicle.slug}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </article>
            )}

            {/* Stacked Complementary Arrivals: 5 Columns */}
            <div className="lg:col-span-5 flex flex-col space-y-8">
              {sideVehicles.map((vehicle, idx) => (
                <article
                  key={vehicle.id}
                  suppressHydrationWarning
                  className={`reveal-on-scroll stagger-${idx + 2} bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 space-y-4 shadow-lg transition-all duration-500 hover:border-[var(--border-subtle)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StatusLabel status={vehicle.status} />
                      <span className="px-2 py-0.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] rounded-[1px]">
                        {vehicle.grade}
                      </span>
                    </div>
                    <CompareButton slug={vehicle.slug} compact />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-5">
                      <Link
                        href={`/vehicles/${vehicle.slug}`}
                        className="block group overflow-hidden rounded-[2px] border border-[var(--border-hairline)]"
                        style={{ viewTransitionName: `vehicle-thumb-${vehicle.slug}` }}
                      >
                        <VehicleImage
                          src={vehicle.images[0] || "/images/vehicles/placeholder-coming-soon.webp"}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          aspectRatio="4/3"
                        />
                      </Link>
                    </div>

                    <div className="sm:col-span-7 space-y-2.5">
                      <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] block">
                        {vehicle.year} &bull; {vehicle.fuel}
                      </span>
                      <Link href={`/vehicles/${vehicle.slug}`} className="block group">
                        <Heading level={4} className="group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                          {vehicle.make} {vehicle.model}
                        </Heading>
                      </Link>
                      <div>
                        {vehicle.price ? (
                          <Numeral
                            value={vehicle.price.toLocaleString("en-US")}
                            prefix="LKR"
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs font-sans uppercase tracking-widest text-[var(--accent)] font-medium">
                            Call For Price
                          </span>
                        )}
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <Link
                          href={`/vehicles/${vehicle.slug}`}
                          className="link-underline text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Secondary Grid: Additional Available Showroom Cars (Quick 1-tap WhatsApp browsing for all customers) */}
          {gridVehicles.length > 0 && (
            <div className="pt-8 sm:pt-14 space-y-8 border-t border-[var(--border-hairline)]">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] font-semibold block">
                    Showroom Highlights
                  </span>
                  <Heading level={3} className="text-xl sm:text-2xl mt-1">
                    More Japanese Stock Available Now
                  </Heading>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-light max-w-md leading-relaxed">
                  Genuine auction-grade Japanese vehicles available at our Kaduruwela &amp; Trincomalee showrooms.
                  Tap WhatsApp on any car for instant photos, pricing, and inspection certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {gridVehicles.map((vehicle, idx) => (
                  <article
                    key={vehicle.id}
                    suppressHydrationWarning
                    className={`reveal-on-scroll stagger-${(idx % 3) + 1} group bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-subtle)] rounded-[2px] overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300`}
                  >
                    <div>
                      {/* Image Container with Badges */}
                      <div className="relative overflow-hidden border-b border-[var(--border-hairline)]">
                        <Link
                          href={`/vehicles/${vehicle.slug}`}
                          className="block group overflow-hidden"
                          style={{ viewTransitionName: `vehicle-thumb-${vehicle.slug}` }}
                        >
                          <VehicleImage
                            src={vehicle.images[0] || "/images/vehicles/placeholder-coming-soon.webp"}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            aspectRatio="16/10"
                          />
                        </Link>

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                          <StatusLabel status={vehicle.status} />
                          <span className="px-2 py-0.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)] rounded-[1px]">
                            {vehicle.grade}
                          </span>
                        </div>

                        {/* Compare Button */}
                        <div className="absolute top-3 right-3">
                          <CompareButton slug={vehicle.slug} compact />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 sm:p-6 space-y-4">
                        {/* Branch Location & Engine */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                          <span className="text-[var(--accent)] font-medium">
                            📍 {vehicle.branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Main"}
                          </span>
                          <span>{vehicle.year} &bull; {vehicle.fuel}</span>
                        </div>

                        {/* Title */}
                        <Link href={`/vehicles/${vehicle.slug}`} className="block group">
                          <Heading level={4} className="text-lg group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Heading>
                        </Link>

                        {/* Price */}
                        <div>
                          {vehicle.price ? (
                            <Numeral
                              value={vehicle.price.toLocaleString("en-US")}
                              prefix="LKR"
                              size="sm"
                            />
                          ) : (
                            <span className="text-xs font-sans uppercase tracking-widest text-[var(--accent)] font-semibold">
                              Call For Price / Inquire
                            </span>
                          )}
                        </div>

                        {/* 4-Stat Micro Spec Strip */}
                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border-hairline)] text-center">
                          <div className="bg-[var(--bg-base)] p-1.5 rounded-[1px] border border-[var(--border-hairline)]">
                            <span className="text-[9px] font-mono text-[var(--text-muted)] block uppercase">KM</span>
                            <span className="text-[10px] font-mono text-[var(--text-primary)] font-semibold truncate block">
                              {(vehicle.mileage / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div className="bg-[var(--bg-base)] p-1.5 rounded-[1px] border border-[var(--border-hairline)]">
                            <span className="text-[9px] font-mono text-[var(--text-muted)] block uppercase">Engine</span>
                            <span className="text-[10px] font-mono text-[var(--text-primary)] font-semibold truncate block">
                              {vehicle.engineCC}cc
                            </span>
                          </div>
                          <div className="bg-[var(--bg-base)] p-1.5 rounded-[1px] border border-[var(--border-hairline)]">
                            <span className="text-[9px] font-mono text-[var(--text-muted)] block uppercase">Drive</span>
                            <span className="text-[10px] font-mono text-[var(--text-primary)] font-semibold truncate block">
                              {vehicle.driveType}
                            </span>
                          </div>
                          <div className="bg-[var(--bg-base)] p-1.5 rounded-[1px] border border-[var(--border-hairline)]">
                            <span className="text-[9px] font-mono text-[var(--text-muted)] block uppercase">Grade</span>
                            <span className="text-[10px] font-mono text-[var(--text-primary)] font-semibold truncate block">
                              {vehicle.auctionGrade || "5.0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar (1-Tap WhatsApp for non-tech buyers + View Details) */}
                    <div className="p-5 sm:p-6 pt-0 flex items-center gap-2.5">
                      <WhatsAppButton
                        vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        label="WhatsApp"
                        size="sm"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        href={`/vehicles/${vehicle.slug}`}
                        className="flex-1"
                      >
                        View Car
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Bottom Showroom CTA Strip */}
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="md"
                  href="/vehicles"
                  className="w-full sm:w-auto px-8 py-3.5"
                >
                  Browse Full Showroom Inventory ({vehicles.length}+ Vehicles) &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
