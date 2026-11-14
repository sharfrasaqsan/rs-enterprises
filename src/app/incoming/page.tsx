import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Divider } from "@/components/ui/Divider";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Numeral } from "@/components/ui/Numeral";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getAllPublishedVehicles } from "@/lib/vehicles";
import { getCompanySettings } from "@/lib/settings";
import { Vehicle } from "@/types/vehicle";
import { LeadEnquiryForm } from "@/components/vehicle-detail/LeadEnquiryForm";
import { ImportStageStepper } from "@/components/incoming/ImportStageStepper";

export const metadata: Metadata = {
  title: "In-Transit & Auction Pipeline | RS Enterprises Polonnaruwa",
  description:
    "Explore upcoming Japanese vehicles secured at USS/TAA auctions and en route aboard ocean carriers to Hambantota and Colombo ports. Pre-order and reserve your vehicle before showroom arrival.",
  alternates: {
    canonical: "/incoming",
  },
  openGraph: {
    title: "In-Transit & Auction Pipeline | RS Enterprises Polonnaruwa",
    description:
      "Direct Japanese imports en route to Sri Lanka. Reserve authentic auction-grade Japanese vehicles before showroom arrival.",
    url: "/incoming",
  },
};

const STAGE_DESCRIPTIONS: Record<
  string,
  { label: string; stageNumber: string; detail: string }
> = {
  japan_auction: {
    label: "Secured at Japan Auction",
    stageNumber: "01",
    detail:
      "Vehicle won at USS Tokyo / TAA / ARAI auction. Odometer verified with JEVIC certification in Japan.",
  },
  in_transit: {
    label: "Ocean Freight En Route",
    stageNumber: "02",
    detail:
      "Loaded on vehicle carrier vessel sailing from Yokohama/Kobe to Hambantota or Colombo Harbor.",
  },
  customs_clearing: {
    label: "Port & Customs Clearance",
    stageNumber: "03",
    detail:
      "Arrived at Sri Lankan port. Sri Lanka Customs duty assessment and clearance formalities underway.",
  },
  in_stock: {
    label: "Showroom Preparation",
    stageNumber: "04",
    detail:
      "Transferred to Kaduruwela showroom. Pre-delivery inspection and detailing in progress.",
  },
};

function formatArrivalMonth(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default async function IncomingPage() {
  const [allVehicles, settings] = await Promise.all([
    getAllPublishedVehicles(),
    getCompanySettings(),
  ]);

  const incomingVehicles = allVehicles.filter((v) => v.status === "incoming");

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "In-Transit Pipeline", href: "/incoming" },
  ];

  return (
    <main className="min-h-screen">
      {/* Editorial Header Section */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>Direct Japanese Import Pipeline</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              Vehicles En Route to Sri Lanka
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              Every vehicle listed here has been secured at Japan&apos;s premier auctions (USS,
              TAA, CAA, ARAI) and is currently in our verified logistics chain. Reserve
              prior to port docking to secure confirmed CIF or duty-cleared ownership.
            </p>
          </div>

          {/* 4-Stage Import Logistics Tracker Overview */}
          <div className="mt-14 pt-10 border-t border-[var(--border-hairline)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  step: "01",
                  title: "Auction & Inspection",
                  desc: "Secured at Tokyo/Kobe auctions with JEVIC odometer verification & JAAI checks.",
                },
                {
                  step: "02",
                  title: "Ocean Freight",
                  desc: "Sailing aboard dedicated Ro-Ro vehicle carriers to Hambantota or Colombo.",
                },
                {
                  step: "03",
                  title: "Port Customs",
                  desc: "Harbor clearance, Sri Lanka Customs assessment, and RMV documentation.",
                },
                {
                  step: "04",
                  title: "Showroom Handover",
                  desc: "Final diagnostic check, multi-point detail, and collection at Kaduruwela.",
                },
              ].map((stage, idx) => (
                <div
                  key={stage.step}
                  className="p-6 bg-[var(--bg-base)] border border-[var(--border-hairline)] relative"
                >
                  <span className="text-xs font-mono font-medium text-[var(--accent)] tracking-widest block mb-2">
                    PHASE {stage.step}
                  </span>
                  <h2 className="font-serif text-lg text-[var(--text-primary)] mb-2">
                    {stage.title}
                  </h2>
                  <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed">
                    {stage.desc}
                  </p>
                  {idx < 3 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-[1px] bg-[var(--border-hairline)] z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Incoming Inventory List */}
      <Section className="py-16 sm:py-20">
        <Container size="wide">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[var(--border-hairline)]">
            <div>
              <Eyebrow>Confirmed Pipeline</Eyebrow>
              <Heading level={2} className="text-2xl sm:text-3xl mt-1">
                Secured In-Transit Units
              </Heading>
            </div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              {incomingVehicles.length} {incomingVehicles.length === 1 ? "unit" : "units"} en route
            </p>
          </div>

          {incomingVehicles.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p className="font-serif text-2xl text-[var(--text-primary)]">
                Next Auction Batch In Preparation
              </p>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                All previous in-transit units have been cleared or reserved. We bid weekly at USS
                Tokyo and TAA. Contact our import desk to place an auction request.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <Link
                  href="/vehicles"
                  className="min-h-[44px] px-6 inline-flex items-center text-xs uppercase tracking-widest bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Browse Available Showroom Stock
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {incomingVehicles.map((vehicle: Vehicle) => {
                const stageInfo =
                  (vehicle.importStage && STAGE_DESCRIPTIONS[vehicle.importStage]) ||
                  STAGE_DESCRIPTIONS.in_transit;
                const formattedPrice = vehicle.price
                  ? vehicle.price.toLocaleString("en-US")
                  : null;

                const whatsappPreOrderText = encodeURIComponent(
                  `Hello RS Enterprises, I am interested in reserving the in-transit ${vehicle.year} ${vehicle.make} ${vehicle.model} (Grade: ${vehicle.grade}, Color: ${vehicle.color}). Please share the CIF quotation, auction sheet, and expected handover timeline.`
                );

                return (
                  <article
                    key={vehicle.id}
                    className="py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                  >
                    {/* Visual 5 cols */}
                    <div className="lg:col-span-5 relative">
                      <Link href={`/vehicles/${vehicle.slug}`} className="block">
                        <VehicleImage
                          src={vehicle.images[0] || "/images/vehicles/sample-vezel.svg"}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          aspectRatio="16/10"
                        />
                      </Link>
                      <div className="absolute top-3 left-3 z-10">
                        <StatusLabel status="incoming" />
                      </div>
                    </div>

                    {/* Information & Stage 7 cols */}
                    <div className="lg:col-span-7 space-y-6">
                      <div>
                        {/* Specs strip */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">
                          <span>{vehicle.year}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                          <span>{vehicle.mileage.toLocaleString("en-US")} KM</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                          <span>{vehicle.engineCC} CC</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                          <span className="text-[var(--accent)]">{vehicle.fuel}</span>
                        </div>

                        {/* Title */}
                        <Link href={`/vehicles/${vehicle.slug}`} className="block group">
                          <Heading
                            level={3}
                            className="text-2xl sm:text-3xl group-hover:text-[var(--accent)] transition-colors"
                          >
                            {vehicle.make} {vehicle.model}{" "}
                            <span className="text-xl font-light text-[var(--text-secondary)]">
                              {vehicle.grade}
                            </span>
                          </Heading>
                        </Link>
                      </div>

                      {/* Refined Import Stage Stepper: Semantic HTML & CSS, Horizontal on Desktop, Vertical on Mobile */}
                      <div className="p-4 sm:p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                        <ImportStageStepper
                          currentStage={vehicle.importStage}
                          expectedArrivalMonth={formatArrivalMonth(vehicle.expectedArrival)}
                        />
                      </div>

                      {/* Pricing and Action row */}
                      <div className="flex flex-wrap items-end justify-between gap-6 pt-2">
                        <div>
                          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] block mb-1">
                            {formattedPrice ? "Estimated CIF / Drive-Away Price" : "Pricing Notice"}
                          </span>
                          {formattedPrice ? (
                            <div className="flex items-baseline gap-2">
                              <Numeral value={`LKR ${formattedPrice}`} size="lg" />
                              <span className="text-xs text-[var(--text-secondary)] font-light">
                                (Subject to exchange &amp; duty)
                              </span>
                            </div>
                          ) : (
                            <span className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] italic">
                              Pre-Order Price on Request
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={`https://wa.me/${settings.mainBranch.whatsapp.replace(/[^0-9]/g, "")}?text=${whatsappPreOrderText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.16em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                          >
                            Register Interest on WhatsApp
                          </a>
                          <Link
                            href={`/vehicles/${vehicle.slug}`}
                            className="min-h-[44px] px-5 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.16em] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                          >
                            View Specs
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      {/* Custom Japan Auction Request Section */}
      <Section variant="surface" className="py-20 border-t border-[var(--border-hairline)]">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <Eyebrow>Bespoke Import Order</Eyebrow>
              <Heading level={2} className="text-3xl sm:text-4xl font-normal leading-tight">
                Order Your Custom Vehicle Directly From Tokyo Auctions
              </Heading>
              <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
                Looking for a specific grade, color combination, or equipment package? RS Enterprises
                holds active bidding credentials with USS Tokyo, TAA, CAA, and ARAI.
              </p>

              <div className="space-y-4 pt-2 text-xs font-light text-[var(--text-secondary)]">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--accent)] font-semibold">01</span>
                  <p>
                    <strong className="text-[var(--text-primary)] font-medium">Original Auction Sheet:</strong>{" "}
                    We provide the unedited Japanese inspection sheet with real-time English translation before placing any bid.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--accent)] font-semibold">02</span>
                  <p>
                    <strong className="text-[var(--text-primary)] font-medium">Odometer Certification:</strong>{" "}
                    Every unit is verified through JEVIC / JAAI inspection authorities in Japan before shipment.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--accent)] font-semibold">03</span>
                  <p>
                    <strong className="text-[var(--text-primary)] font-medium">Complete Clearance:</strong>{" "}
                    We handle ocean freight, marine insurance, Hambantota / Colombo port customs clearance, and RMV registration.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <PhoneLink
                  number={settings.mainBranch.phone}
                  displayNumber={settings.mainBranch.phone}
                  label="Direct Import Hotline"
                />
              </div>
            </div>

            {/* Custom Pre-Order Form */}
            <div className="lg:col-span-7 bg-[var(--bg-base)] border border-[var(--border-hairline)] p-8 sm:p-10">
              <div className="mb-6">
                <Eyebrow>Auction Bidding Request</Eyebrow>
                <Heading level={3} className="text-2xl mt-1">
                  Submit Desired Vehicle Specifications
                </Heading>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                  Specify the model, year, and budget. Our Kaduruwela import desk will research
                  upcoming Japanese auction catalogues and contact you with options.
                </p>
              </div>

              <LeadEnquiryForm
                vehicleId="incoming-auction-request"
                vehicleTitle="Custom Japanese Auction Import Request"
              />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
