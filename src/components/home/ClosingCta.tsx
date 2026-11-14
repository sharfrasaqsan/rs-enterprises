import React from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompanySettings } from "@/types/settings";

export function ClosingCta({ settings }: { settings: CompanySettings }) {
  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-base)] border-t border-[var(--border-hairline)] relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(circle_at_bottom_center,var(--accent)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <Container size="wide">
        <div className="reveal-on-scroll max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <Eyebrow>Direct Japanese Auction Access</Eyebrow>
            <Heading level={2}>
              Acquire Your Next Vehicle Directly from Japan
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto">
              Visit our Kaduruwela main showroom in Polonnaruwa or consult directly
              with our import specialists for bespoke auction bidding and incoming vessel reservations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button variant="diamond" size="lg" href="/vehicles" className="w-full sm:w-auto">
              Explore Available Inventory
            </Button>
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Priority WhatsApp Inquiry"
              className="w-full sm:w-auto"
            />
          </div>

          <div className="pt-8 border-t border-[var(--border-hairline)] max-w-md mx-auto text-xs font-sans uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span>Main Showroom: No.37/1, Kaduruwela, Polonnaruwa</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

