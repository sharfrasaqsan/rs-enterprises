import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";

export function ServicesList() {
  const services = [
    {
      num: "01",
      title: "Direct Japanese Auction Bidding on Demand",
      description:
        "Commission our licensed Tokyo agents to inspect, evaluate, and bid for your preferred vehicle at USS Tokyo, TAA, and CAA auto auctions. Receive high-resolution auction sheets, interior 360-degree photography, and translation before committing.",
      actionText: "Request Custom Auction Bid",
      href: "/services#auction-bidding",
    },
    {
      num: "02",
      title: "Port Customs Clearance & Harbor Handling",
      description:
        "End-to-end clearing and freight handling at Hambantota International Port and the Port of Colombo. We handle customs duty documentation, excise tax settlements, and secure carrier transportation directly to our Polonnaruwa main showroom.",
      actionText: "Learn About Customs Clearance",
      href: "/services#customs-clearing",
    },
    {
      num: "03",
      title: "Genuine Japanese OEM & Aftermarket Spare Parts",
      description:
        "Direct imports of authentic spare parts for Toyota, Honda, Nissan, and Mitsubishi models. From hybrid battery replacements and suspension assemblies to original body panels and electronics, dispatched island-wide from Kaduruwela.",
      actionText: "Inquire Spare Parts Catalog",
      href: "/spare-parts",
    },
    {
      num: "04",
      title: "Vehicle Valuation & Showroom Trade-In Service",
      description:
        "Fair, transparent market valuations for registered Japanese vehicles. Trade in your current vehicle against an unregistered auction-grade arrival with seamless title transfer and financing assistance.",
      actionText: "Book Valuation Inspection",
      href: "/services#valuation",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-base)]">
      <Container size="wide">
        <div className="space-y-12 sm:space-y-16">
          {/* Section Header */}
          <div className="reveal-on-scroll max-w-2xl space-y-3">
            <Eyebrow>Comprehensive Automotive Solutions</Eyebrow>
            <Heading level={2}>
              Curated Automotive Services
            </Heading>
            <p className="text-base text-[var(--text-secondary)] font-light leading-relaxed">
              Beyond showroom inventory, RS Enterprises provides high-touch import consultancy,
              custom auction bidding, and authentic parts logistics.
            </p>
          </div>

          {/* Hairline-Divided Editorial List */}
          <div className="border-t border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
            {services.map((service, idx) => (
              <div
                key={service.num}
                className={`reveal-on-scroll stagger-${idx + 1} py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline group`}
              >
                {/* Numeral: 2 cols */}
                <div className="md:col-span-2">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-[var(--accent)] tabular-nums">
                    {service.num}
                  </span>
                </div>

                {/* Title & Description: 7 cols */}
                <div className="md:col-span-7 space-y-3">
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                    {service.description}
                  </p>
                </div>

                {/* Direct Action Link: 3 cols */}
                <div className="md:col-span-3 md:text-right pt-2 md:pt-0">
                  <Link
                    href={service.href}
                    className="link-underline inline-flex items-center min-h-[44px] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    <span>{service.actionText}</span>
                    <span className="ml-2">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

