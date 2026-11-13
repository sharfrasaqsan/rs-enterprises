import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Numeral } from "@/components/ui/Numeral";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { getCompanySettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About Us | RS Enterprises Company Pvt Ltd Polonnaruwa",
  description:
    "Learn about RS Enterprises Company Pvt Ltd, direct importer of premium Japanese motor vehicles and genuine spare parts. Main showroom at Kaduruwela, Polonnaruwa and coastal branch in Trincomalee.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | RS Enterprises Company Pvt Ltd",
    description:
      "Direct importer and licensed dealer of Japanese vehicles and genuine spare parts in Kaduruwela, Polonnaruwa and Trincomalee.",
    url: "/about",
  },
};

export default async function AboutPage() {
  const settings = await getCompanySettings();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];

  return (
    <main className="min-h-screen">
      {/* Editorial Hero Header */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>Company Heritage &amp; Ethos</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              A Benchmark in Japanese Automotive Imports
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              RS Enterprises Company Pvt Ltd was founded with a singular conviction: discerning Sri Lankan
              motorists deserve uncompromised access to verified, auction-grade Japanese vehicles
              and genuine spare parts, backed by absolute institutional integrity.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Connect with Managing Director"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Kaduruwela Head Office"
            />
          </div>
        </Container>
      </Section>

      {/* Editorial Narrative Section */}
      <Section className="py-16 sm:py-24">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Mission & Core Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <Eyebrow>The RS Standards</Eyebrow>
              <Heading level={2} className="text-3xl sm:text-4xl font-normal leading-tight">
                Eliminating Ambiguity from the Sri Lankan Car Market
              </Heading>

              <div className="space-y-4 text-sm sm:text-base font-light text-[var(--text-secondary)] leading-relaxed">
                <p>
                  For years, vehicle buyers across Sri Lanka—particularly throughout the North Central
                  and Eastern Provinces—have faced inconsistent vehicle histories, hidden accident
                  repairs, and manipulated odometers.
                </p>
                <p>
                  RS Enterprises Company Pvt Ltd transformed this landscape by establishing direct
                  auction-house bidding access in Japan. Rather than purchasing through intermediary
                  traders, we secure vehicles directly on the auction floors of USS Tokyo, USS
                  Yokohama, and TAA.
                </p>
                <p>
                  Every automobile we import is independently appraised before shipment. The original,
                  unaltered Japanese auction inspection certificate and digital JEVIC odometer record
                  are handed directly to the vehicle owner upon collection.
                </p>
              </div>

              {/* Verified Metrics (Real, confirmed facts or clearly stated parameters) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-hairline)]">
                <div>
                  <Numeral value="100%" size="lg" />
                  <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block mt-1">
                    JEVIC Certified Odometers
                  </span>
                </div>
                <div>
                  <Numeral value="4.0+" size="lg" />
                  <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block mt-1">
                    Japanese Auction Grades
                  </span>
                </div>
                <div>
                  <Numeral value="2" size="lg" />
                  <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block mt-1">
                    Provincial Showrooms
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Distinct Editorial Card */}
            <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 sm:p-10 space-y-6">
              <div>
                <Eyebrow>Corporate Identity &amp; Governance</Eyebrow>
                <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                  RS Enterprises Company Pvt Ltd
                </h3>
                <div className="space-y-1 mt-2">
                  <p className="text-xs font-mono text-[var(--accent)] tracking-wider">
                    Registration No: <strong>TH/DS/ACCT/BR/38/2018</strong>
                  </p>
                  <p className="text-xs font-sans text-[var(--text-secondary)]">
                    Proprietor: <strong className="text-[var(--text-primary)]">S.M. Fajith</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-light text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-hairline)] pt-4">
                <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)] font-semibold block">
                    Strategic Alliance
                  </span>
                  <p className="font-medium text-[var(--text-primary)]">
                    Sterling &amp; Kobe Partnership
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Collaborating with Sterling &amp; Kobe vehicle inspection networks in Japan for verified auction acquisition, odometer certification, and institutional quality clearance.
                  </p>
                </div>

                <div>
                  <strong className="text-[var(--text-primary)] block font-medium uppercase tracking-wider text-[11px] mb-1">
                    Kaduruwela Main Complex
                  </strong>
                  <p>{settings.mainBranch.address}</p>
                  <p className="mt-1">Telephone: {settings.mainBranch.phone}</p>
                  <p>WhatsApp: {settings.mainBranch.whatsapp}</p>
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)]">
                  <strong className="text-[var(--text-primary)] block font-medium uppercase tracking-wider text-[11px] mb-1">
                    Trincomalee Coastal Branch
                  </strong>
                  <p>{settings.coastalBranch.address}</p>
                  <p className="mt-1">Telephone: {settings.coastalBranch.phone}</p>
                  <span className="text-[10px] italic text-[var(--accent)] block mt-0.5">
                    * Showroom expansion details to be confirmed
                  </span>
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)]">
                  <strong className="text-[var(--text-primary)] block font-medium uppercase tracking-wider text-[11px] mb-1">
                    Primary Operations
                  </strong>
                  <p>
                    Direct Japanese motor vehicle imports, genuine OEM automotive spare parts,
                    auction bidding services, and hybrid diagnostics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* The 3 Pillars of Integrity (Inverted Section) */}
      <Section variant="inverted" className="py-20 sm:py-28 border-t border-[var(--border-hairline)]">
        <Container size="wide">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Guiding Principles</Eyebrow>
            <Heading level={2} className="text-3xl sm:text-4xl mt-1 text-[var(--inverted-text-primary)]">
              The Three Pillars of Our Handover
            </Heading>
            <p className="text-sm font-light text-[var(--inverted-text-secondary)] mt-2">
              Every transaction at RS Enterprises is governed by three non-negotiable standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Original Auction Verification",
                desc: "We provide the original Japanese inspection document directly from USS or TAA. No altered grades, no concealed undercarriage notes, and no misrepresented interior conditions.",
              },
              {
                num: "02",
                title: "Verifiable Odometer History",
                desc: "Digital verification via JEVIC (Japan Export Vehicle Inspection Center). You can independently verify the vehicle's export mileage on the official Japanese registry portal.",
              },
              {
                num: "03",
                title: "Genuine Parts & Fluid Integrity",
                desc: "Before collection, all consumable fluids are checked and replaced with authentic Japanese lubricants (Toyota Castle, Honda Ultra). We never install counterfeit components.",
              },
            ].map((pillar) => (
              <div
                key={pillar.num}
                className="p-8 bg-[var(--inverted-surface)] border border-[var(--inverted-border)] space-y-4"
              >
                <span className="font-mono text-3xl font-light text-[var(--inverted-accent)]">
                  {pillar.num}
                </span>
                <h3 className="font-serif text-2xl text-[var(--inverted-text-primary)]">
                  {pillar.title}
                </h3>
                <p className="text-xs font-light text-[var(--inverted-text-secondary)] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-[var(--inverted-border)] flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-[var(--inverted-text-primary)]">
              Experience the difference at our Kaduruwela showroom.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/vehicles"
                className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-[0.16em] bg-[var(--inverted-accent)] text-[var(--inverted-base)] hover:opacity-90 transition-opacity"
              >
                Browse Current Stock
              </Link>
              <Link
                href="/contact"
                className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-[0.16em] border border-[var(--inverted-border)] text-[var(--inverted-text-primary)] hover:border-[var(--inverted-text-primary)] transition-colors"
              >
                Plan Showroom Visit
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
