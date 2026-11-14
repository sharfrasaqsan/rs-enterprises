import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Divider } from "@/components/ui/Divider";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompanySettings } from "@/types/settings";

export function Footer({ settings }: { settings: CompanySettings }) {
  const currentYear = 2026;

  return (
    <footer className="w-full bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] pt-16 pb-24 md:pb-16 text-[var(--text-secondary)]">
      <Container size="wide">
        {/* Main Grid: 12-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          {/* Brand & Mission: 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <Link href="/" className="inline-block group">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="font-serif text-2xl font-normal tracking-[0.12em] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    RS ENTERPRISES
                  </span>
                </div>
              </Link>
              <p className="text-xs font-sans uppercase tracking-[0.24em] text-[var(--accent)] mt-1 ml-3.5">
                Company Pvt Ltd &bull; Est. 2018
              </p>
            </div>

            <p className="text-sm font-light leading-relaxed max-w-sm">
              Direct importer and licensed dealer of auction-grade Japanese vehicles
              and genuine OEM spare parts. Serving clients across the North Central
              Province, Eastern Province, and island-wide.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <WhatsAppButton
                number={settings.mainBranch.whatsapp}
                label="WhatsApp Desk"
                variant="outline"
              />
              <PhoneLink
                number={settings.mainBranch.phone}
                displayNumber={settings.mainBranch.phone}
                label="Kaduruwela Office"
                variant="outline"
              />
            </div>
          </div>

          {/* Showroom Locations: 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <Eyebrow>Showroom Locations</Eyebrow>
            <div className="space-y-4 text-xs font-light">
              <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                    Kaduruwela Main Showroom
                  </span>
                  <span className="text-[10px] uppercase font-mono text-[var(--accent)]">
                    Main Branch
                  </span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {settings.mainBranch.address}
                </p>
                <div className="pt-1 flex flex-col space-y-0.5 text-[var(--text-muted)]">
                  <span>Hours: {settings.mainBranch.hours}</span>
                  <span>Hotline: {settings.mainBranch.phone}</span>
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                    Trincomalee Showroom
                  </span>
                  <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">
                    {settings.coastalBranch.status === "coming_soon" ? "Opening Soon" : "Operational"}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {settings.coastalBranch.address}
                </p>
                <div className="pt-1 text-[var(--text-muted)]">
                  <span>Inquiries: {settings.coastalBranch.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links: 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <Eyebrow>Inventory & Services</Eyebrow>
            <ul className="space-y-2.5 text-xs font-sans uppercase tracking-[0.16em]">
              <li>
                <Link href="/vehicles" className="hover:text-[var(--text-primary)] transition-colors">
                  Showroom Stock
                </Link>
              </li>
              <li>
                <Link href="/incoming" className="hover:text-[var(--text-primary)] transition-colors">
                  In-Transit Pipeline
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-[var(--text-primary)] transition-colors">
                  Compare Vehicles
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[var(--text-primary)] transition-colors">
                  Auction Bidding
                </Link>
              </li>
              <li>
                <Link href="/spare-parts" className="hover:text-[var(--text-primary)] transition-colors">
                  Genuine Spare Parts
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Info & Staff Portal: 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <Eyebrow>Information</Eyebrow>
            <ul className="space-y-2.5 text-xs font-sans uppercase tracking-[0.16em]">
              <li>
                <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">
                  About Heritage
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">
                  Contact Showroom
                </Link>
              </li>
              <li>
                <Link href="/styleguide" className="hover:text-[var(--accent)] transition-colors">
                  Design Styleguide
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mr-2" />
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Divider variant="hairline" />

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sans text-[var(--text-muted)] uppercase tracking-wider">
          <div>
            &copy; {currentYear} RS Enterprises Company Pvt Ltd. All rights reserved.
            <span className="hidden sm:inline"> &bull; Reg: {settings.registrationNumber}</span>
          </div>

          <div className="flex items-center space-x-6">
            <span>Direct Japanese Import Specialist</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
            <span>Sri Lanka</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

