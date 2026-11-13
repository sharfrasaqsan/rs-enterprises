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
import { Divider } from "@/components/ui/Divider";
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]">
            <div className="space-y-2">
              <Eyebrow>Showroom Acquisitions</Eyebrow>
              <Heading level={2}>
                Recent Japanese Arrivals
              </Heading>
            </div>
            <Link
              href="/vehicles"
              className="text-xs font-sans uppercase font-medium tracking-[0.18em] text-[var(--accent)] hover:underline underline-offset-8 transition-colors self-start sm:self-auto min-h-[44px] inline-flex items-center"
            >
              View Complete Showroom Inventory &rarr;
            </Link>
          </div>

          {/* Asymmetric 12-Column Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Major Feature Article: 7 Columns */}
            {leadVehicle && (
              <article className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <StatusLabel status={leadVehicle.status} />
                  <CompareButton slug={leadVehicle.slug} />
                </div>

                <Link href={`/vehicles/${leadVehicle.slug}`} className="block group">
                  <VehicleImage
                    src={leadVehicle.images[0] || "/images/vehicles/sample-prado.svg"}
                    alt={`${leadVehicle.year} ${leadVehicle.make} ${leadVehicle.model}`}
                    aspectRatio="16/10"
                  />
                </Link>

                <div className="space-y-3">
                  <div className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-wider">
                    {leadVehicle.grade} &bull; Auction Grade Verified
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
                  <Numeral value={leadVehicle.mileage.toLocaleString()} suffix="km" label="Mileage" size="sm" />
                  <Numeral value={leadVehicle.engineCC.toLocaleString()} suffix="cc" label="Displacement" size="sm" />
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
                      className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[2px] border border-[var(--border-subtle)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury"
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
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusLabel status={vehicle.status} />
                    <CompareButton slug={vehicle.slug} compact />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5">
                      <Link href={`/vehicles/${vehicle.slug}`} className="block group">
                        <VehicleImage
                          src={vehicle.images[0] || "/images/vehicles/sample-vezel.svg"}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          aspectRatio="4/3"
                        />
                      </Link>
                    </div>

                    <div className="sm:col-span-7 space-y-2">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
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
                          <span className="text-xs font-sans uppercase tracking-widest text-[var(--accent)]">
                            Call For Price
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Divider variant="hairline" />

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span className="tabular-nums">{vehicle.mileage.toLocaleString()} km</span>
                    <Link
                      href={`/vehicles/${vehicle.slug}`}
                      className="font-sans uppercase text-[11px] font-medium tracking-[0.16em] text-[var(--accent)] hover:underline"
                    >
                      View Specs &rarr;
                    </Link>
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

