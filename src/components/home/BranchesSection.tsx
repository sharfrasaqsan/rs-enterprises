import React from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompanySettings } from "@/types/settings";

export function BranchesSection({ settings }: { settings: CompanySettings }) {
  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)]">
      <Container size="wide">
        <div className="space-y-12 sm:space-y-16">
          {/* Header */}
          <div className="reveal-on-scroll max-w-2xl space-y-3">
            <Eyebrow>Showroom Locations &bull; Island-Wide Reach</Eyebrow>
            <Heading level={2}>
              Showroom Network &amp; Contacts
            </Heading>
            <p className="text-base text-[var(--text-secondary)] font-light leading-relaxed">
              Experience our curated showroom collection in person or consult directly
              with our import directors.
            </p>
          </div>

          {/* Asymmetric Branch Dossiers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* 1. Main Showroom: Kaduruwela, Polonnaruwa (7 cols) */}
            <div className="reveal-on-scroll stagger-1 lg:col-span-7 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] block">
                    Headquarters &bull; Primary Showroom
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)] mt-1">
                    {settings.mainBranch.name}
                  </h3>
                </div>
                <span className="inline-flex px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--accent)] rounded-[2px]">
                  Operational
                </span>
              </div>

              <div className="space-y-4 text-sm font-light leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Showroom Address
                    </span>
                    <p className="text-[var(--text-primary)] font-normal">
                      {settings.mainBranch.address}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Operating Hours
                    </span>
                    <p className="text-[var(--text-primary)] font-normal">
                      {settings.mainBranch.hours}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-hairline)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Direct Landline
                    </span>
                    <span className="text-[var(--text-primary)] tabular-nums font-mono">
                      {settings.mainBranch.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Inquiry Email
                    </span>
                    <span className="text-[var(--text-primary)] font-mono">
                      {settings.mainBranch.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <WhatsAppButton
                  number={settings.mainBranch.whatsapp}
                  label="WhatsApp Kaduruwela Desk"
                />
                <PhoneLink
                  number={settings.mainBranch.phone}
                  displayNumber={settings.mainBranch.phone}
                  label="Call Showroom Hotline"
                  variant="outline"
                />
              </div>
            </div>

            {/* 2. Coastal Showroom: Trincomalee (5 cols) */}
            <div className="reveal-on-scroll stagger-2 lg:col-span-5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-10 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] block">
                      Eastern Province Showroom
                    </span>
                    <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-1">
                      {settings.coastalBranch.name}
                    </h3>
                  </div>
                  <span className="inline-flex px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-[2px]">
                    {settings.coastalBranch.status === "coming_soon" ? "Opening Soon" : "Active"}
                  </span>
                </div>

                <div className="space-y-3 text-sm font-light leading-relaxed">
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Location
                    </span>
                    <p className="text-[var(--text-primary)]">
                      {settings.coastalBranch.address}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans uppercase font-medium tracking-[0.2em] text-[var(--text-muted)] block mb-1">
                      Schedule
                    </span>
                    <p className="text-[var(--text-secondary)]">
                      {settings.coastalBranch.hours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-hairline)] space-y-3">
                <WhatsAppButton
                  number={settings.coastalBranch.whatsapp}
                  label="Inquire Trincomalee Delivery"
                  variant="outline"
                  className="w-full text-center"
                />
                <PhoneLink
                  number={settings.coastalBranch.phone}
                  displayNumber={settings.coastalBranch.phone}
                  label="Trincomalee Line"
                  variant="outline"
                  className="w-full text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

