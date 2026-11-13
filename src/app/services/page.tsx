import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { getCompanySettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Direct Import & Vehicle Services | RS Enterprises Polonnaruwa",
  description:
    "Comprehensive automotive services: Direct Japanese auction bidding (USS/TAA), JEVIC odometer inspection, Hambantota/Colombo customs clearance, hybrid diagnostics, and trade-ins.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Direct Import & Automotive Services | RS Enterprises",
    description:
      "Direct Japanese auction access, JEVIC certified odometer checks, Sri Lanka customs clearing, and hybrid diagnostics.",
    url: "/services",
  },
};

const SERVICES_LIST = [
  {
    num: "01",
    title: "Direct Japanese Auction Bidding",
    headline: "Live access to over 150,000 vehicles weekly across Japan",
    details: [
      "Real-time bidding credentials at USS Tokyo, USS Yokohama, TAA (Toyota Auto Auction), CAA, and ARAI.",
      "Comprehensive original Japanese auction sheet translation and grade analysis (Grade 4.5, 5, 6, and S-grade delivery units).",
      "High-resolution exterior and interior inspection photographs before placing any bid.",
      "Fixed, transparent service commission with zero hidden broker markups.",
    ],
  },
  {
    num: "02",
    title: "Independent JEVIC & JAAI Inspection",
    headline: "Guaranteed odometer authenticity and structural integrity",
    details: [
      "JEVIC (Japan Export Vehicle Inspection Center) official digital odometer certificate issued in Japan.",
      "JAAI (Japan Automobile Appraisal Institute) roadworthiness and structural compliance check.",
      "Mandatory radioactive screening certification prior to port loading in Yokohama or Kobe.",
      "100% money-back guarantee against odometer tampering or undeclared auction repair history.",
    ],
  },
  {
    num: "03",
    title: "Ocean Freight & Harbor Customs Clearance",
    headline: "Seamless port logistics at Hambantota and Colombo",
    details: [
      "Secured space on premium Ro-Ro (Roll-on/Roll-off) vehicle carriers (NYK Line, Mitsui O.S.K. Lines, Toyofuji).",
      "Full marine insurance coverage from Japanese yard dispatch until Sri Lankan port discharge.",
      "Expert customs brokerage handling Sri Lanka Customs duty calculation, luxury tax, and environmental levies.",
      "Safe carrier transport from port directly to our Kaduruwela or Trincomalee showrooms.",
    ],
  },
  {
    num: "04",
    title: "Hybrid & High-Voltage Diagnostics",
    headline: "Specialized care for Toyota, Honda, and Nissan electrified powertrains",
    details: [
      "Dedicated Toyota Techstream / Denso DST-i computer diagnostics for hybrid battery internal resistance and cell balance.",
      "High-voltage inverter coolant testing and electric motor performance validation.",
      "Hybrid battery cooling fan cleaning and intake filter renewal (essential for Sri Lankan tropical climate).",
      "Pre-delivery multi-point safety and electrical system certification.",
    ],
  },
  {
    num: "05",
    title: "Part-Exchange & Fair Valuation",
    headline: "Upgrade your current vehicle with transparent market trade-in",
    details: [
      "On-site technical evaluation at our Kaduruwela main showroom or Trincomalee branch.",
      "Transparent valuation based on current Colombo/regional market resale values.",
      "Direct balance settlement or finance adjustment towards your newly imported Japanese vehicle.",
      "Immediate ownership transfer and RMV documentation assistance.",
    ],
  },
];

export default async function ServicesPage() {
  const settings = await getCompanySettings();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
  ];

  return (
    <main className="min-h-screen">
      {/* Editorial Header */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>End-To-End Direct Import Services</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              From Tokyo Auction Floor to Your Driveway
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              Importing an automobile into Sri Lanka requires precision, institutional trust, and
              uncompromising regulatory compliance. RS Enterprises Company Pvt Ltd manages every
              stage of the transaction with verified documentation.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Speak to Import Consultant"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Kaduruwela Office"
            />
          </div>
        </Container>
      </Section>

      {/* Services List Section (Hairline Divided) */}
      <Section className="py-16 sm:py-24">
        <Container size="wide">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Our Capabilities</Eyebrow>
            <Heading level={2} className="text-3xl sm:text-4xl mt-1">
              Direct Import &amp; Dealership Services
            </Heading>
            <p className="text-sm font-light text-[var(--text-secondary)] mt-2">
              Designed for individual buyers, corporate executives, and commercial fleet owners.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
            {SERVICES_LIST.map((srv) => (
              <div
                key={srv.num}
                className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
              >
                {/* Number & Title */}
                <div className="lg:col-span-4 space-y-2">
                  <span className="font-mono text-sm font-semibold text-[var(--accent)] tracking-widest block">
                    SERVICE {srv.num}
                  </span>
                  <Heading level={3} className="text-2xl sm:text-3xl font-serif">
                    {srv.title}
                  </Heading>
                  <p className="text-xs font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] pt-1">
                    {srv.headline}
                  </p>
                </div>

                {/* Details list */}
                <div className="lg:col-span-8">
                  <ul className="space-y-4">
                    {srv.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-sm font-light text-[var(--text-secondary)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4-Step Process Section in Inverted Variant */}
      <Section variant="inverted" className="py-20 sm:py-28 border-t border-[var(--border-hairline)]">
        <Container size="wide">
          <div className="max-w-2xl mb-16">
            <Eyebrow>Import Roadmap</Eyebrow>
            <Heading level={2} className="text-3xl sm:text-4xl mt-1 text-[var(--inverted-text-primary)]">
              How the Direct Import Process Works
            </Heading>
            <p className="text-sm font-light text-[var(--inverted-text-secondary)] mt-2">
              A transparent, timeline-backed import methodology with continuous status updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Specification & Deposit",
                desc: "Choose your desired vehicle make, grade, year, and maximum budget. Place an auction earnest deposit to initiate live Japanese catalogue searching.",
              },
              {
                step: "02",
                title: "Auction Sheet & Bidding",
                desc: "We review genuine Japanese inspection sheets, translate condition markers, and bid on your behalf at USS Tokyo or TAA within your pre-agreed limit.",
              },
              {
                step: "03",
                title: "Shipping & JEVIC",
                desc: "Upon winning, vehicle is transported to Yokohama yard. Odometer certification by JEVIC is executed before loading onto the next Ro-Ro vessel to Sri Lanka.",
              },
              {
                step: "04",
                title: "Customs & Handover",
                desc: "Vessel docks at Hambantota or Colombo. Our clearing agents complete duty payments and deliver your fully detailed car to Polonnaruwa or Trincomalee.",
              },
            ].map((p) => (
              <div
                key={p.step}
                className="p-8 bg-[var(--inverted-surface)] border border-[var(--inverted-border)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="font-mono text-2xl font-light text-[var(--inverted-accent)]">
                    {p.step}
                  </span>
                  <h3 className="font-serif text-xl text-[var(--inverted-text-primary)]">
                    {p.title}
                  </h3>
                  <p className="text-xs font-light text-[var(--inverted-text-secondary)] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-[var(--inverted-border)] flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-serif text-xl text-[var(--inverted-text-primary)]">
                Ready to import your next vehicle?
              </p>
              <p className="text-xs font-light text-[var(--inverted-text-secondary)]">
                Consult with our import director for current exchange rates and duty calculations.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/incoming"
                className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-[0.16em] bg-[var(--inverted-accent)] text-[var(--inverted-base)] hover:opacity-90 transition-opacity"
              >
                View In-Transit Stock
              </Link>
              <Link
                href="/contact"
                className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-[0.16em] border border-[var(--inverted-border)] text-[var(--inverted-text-primary)] hover:border-[var(--inverted-text-primary)] transition-colors"
              >
                Contact Import Desk
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

