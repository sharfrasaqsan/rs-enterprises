import React from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { Divider } from "@/components/ui/Divider";

export function DirectFromJapan() {
  const points = [
    {
      num: "01",
      title: "USS, TAA & CAA Tokyo Live Sourcing",
      body: "Our licensed agents bid directly on your behalf across Tokyo, Nagoya, and Osaka auto auctions. Every vehicle comes with verified Japanese auction inspection sheets (Grade 4.5+ / 5A / 6), authentic export certificates, and certified odometer records.",
      highlight: "Grade 4.5+ / 5A / 6 Standards",
    },
    {
      num: "02",
      title: "Transparent Japanese Yen CIF Invoicing",
      body: "Full financial transparency with direct Japanese Yen (JPY) CIF invoices, official port customs clearance documentation, and duty settlement receipts at Hambantota and Colombo harbors. No hidden markups or tampered documentation.",
      highlight: "Direct Yen Invoice & Port Clearance",
    },
    {
      num: "03",
      title: "Kaduruwela Showroom & Island-Wide Transport",
      body: "Immediate showroom delivery from No.37/1, Kaduruwela, Polonnaruwa or direct transit to our expanding Trincomalee showroom [Details to be confirmed]. Island-wide door-to-door enclosed flatbed carrier delivery available upon request.",
      highlight: "Kaduruwela & Trincomalee Branches",
    },
  ];

  return (
    <Section variant="inverted" spacing="generous">
      <Container size="wide">
        <div className="space-y-12 sm:space-y-16">
          {/* Section Header */}
          <div className="max-w-2xl space-y-3">
            <span className="inline-block font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-inverted)]">
              Import Philosophy &bull; Direct Japanese Procurement
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-normal leading-[1.1] text-[var(--text-inverted)]">
              Direct from Tokyo Auctions to Sri Lankan Roads
            </h2>
            <p className="text-base text-[var(--text-inverted)] opacity-80 font-light leading-relaxed">
              We eliminate intermediaries. Affluent clients gain direct access to premier
              Japanese automotive auctions with complete transparency and certified provenance.
            </p>
          </div>

          <Divider variant="hairline" className="bg-[var(--border-inverted)]" />

          {/* 3 Numbered Points with Large Numerals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {points.map((p) => (
              <div
                key={p.num}
                className="space-y-4 p-6 sm:p-8 border border-[var(--border-inverted)] rounded-[2px] bg-[var(--bg-inverted)]"
              >
                <div className="flex items-baseline justify-between border-b border-[var(--border-inverted)] pb-4">
                  <span className="font-serif text-4xl sm:text-5xl font-light text-[var(--accent-inverted)]">
                    {p.num}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-inverted)] opacity-60">
                    Step {p.num}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-inverted)] leading-tight">
                  {p.title}
                </h3>

                <p className="text-sm font-light leading-relaxed text-[var(--text-inverted)] opacity-75">
                  {p.body}
                </p>

                <div className="pt-2 text-xs font-mono uppercase tracking-wider text-[var(--accent-inverted)]">
                  &bull; {p.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

