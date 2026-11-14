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
import { Vehicle } from "@/types/vehicle";

export function NewArrivals({ vehicles }: { vehicles: Vehicle[] }) {
  if (!vehicles || vehicles.length === 0) return null;

  const leadVehicle = vehicles[0];
  const sideVehicles = vehicles.slice(1, 3);

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
              <Eyebrow>Showroom Acquisitions</Eyebrow>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
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
                    ✦ {leadVehicle.grade} &bull; Auction Grade Verified
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
                        label="Available at Kaduruwela Showroom"
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
                    />
                    <Link
                      href={`/vehicles/${leadVehicle.slug}`}
                      className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-[2px] bg-white text-black hover:bg-[var(--accent)] hover:text-black text-xs font-sans uppercase font-semibold tracking-[0.2em] shadow-md transition-luxury"
                    >
                      Dossier
                    </Link>
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
                          src={vehicle.images[0] || "/images/vehicles/vezel-hybrid.jpg"}
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
        </div>
      </Container>
    </section>
  );
}
