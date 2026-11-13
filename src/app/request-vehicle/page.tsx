import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { getCompanySettings } from "@/lib/settings";
import { RequestVehicleForm } from "@/components/vehicles/RequestVehicleForm";

export const metadata: Metadata = {
  title: "Request a Custom Japanese Vehicle | RS Enterprises Polonnaruwa",
  description:
    "Order any Japanese vehicle directly from USS Tokyo, TAA, or ARAI auctions. Specify your desired model, year, grade, and budget for our Kaduruwela import desk.",
  alternates: {
    canonical: "/request-vehicle",
  },
  openGraph: {
    title: "Request a Vehicle | RS Enterprises",
    description:
      "Direct Japanese auction vehicle sourcing. Specify your desired model, grade, and budget.",
    url: "/request-vehicle",
  },
};

export default async function RequestVehiclePage() {
  const settings = await getCompanySettings();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Showroom", href: "/vehicles" },
    { label: "Request a Vehicle", href: "/request-vehicle" },
  ];

  return (
    <main className="min-h-screen">
      {/* Editorial Header */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>Direct Japanese Auction Sourcing</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              Order Your Exact Specification
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              If your desired model, color, or grade is not currently in our Kaduruwela showroom
              or in-transit stock, we will source it directly from Japan&apos;s live weekly auctions.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Discuss with Auction Specialist"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Kaduruwela Office"
            />
          </div>
        </Container>
      </Section>

      {/* Main Sourcing Form & Guarantees */}
      <Section className="py-16 sm:py-24">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Form (7 cols) */}
            <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 sm:p-12">
              <div className="mb-8">
                <Eyebrow>Custom Order Intake</Eyebrow>
                <Heading level={2} className="text-2xl sm:text-3xl mt-1">
                  Submit Vehicle Request
                </Heading>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                  Fill in your vehicle criteria below. We will scour upcoming USS Tokyo, Yokohama,
                  and Nagoya auction listings to find matching units.
                </p>
              </div>

              <RequestVehicleForm />
            </div>

            {/* Editorial Guarantees & Step Guide (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <Eyebrow>Auction Procurement Protocol</Eyebrow>
                <Heading level={3} className="text-2xl sm:text-3xl mt-1">
                  What Happens Next
                </Heading>
              </div>

              <div className="space-y-6 text-sm font-light text-[var(--text-secondary)]">
                <div className="flex items-start gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent)] tracking-widest mt-0.5">
                    STEP 1
                  </span>
                  <div>
                    <strong className="text-[var(--text-primary)] font-medium block">
                      Auction Catalog Matching
                    </strong>
                    <p className="text-xs mt-1 leading-relaxed">
                      Our procurement team searches upcoming USS and TAA auction catalogues for units
                      matching your make, grade, and mileage criteria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent)] tracking-widest mt-0.5">
                    STEP 2
                  </span>
                  <div>
                    <strong className="text-[var(--text-primary)] font-medium block">
                      Auction Sheet &amp; Translation
                    </strong>
                    <p className="text-xs mt-1 leading-relaxed">
                      We share high-resolution photographs and translated Japanese inspection sheets
                      with you on WhatsApp. We only bid with your explicit consent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent)] tracking-widest mt-0.5">
                    STEP 3
                  </span>
                  <div>
                    <strong className="text-[var(--text-primary)] font-medium block">
                      Securing &amp; Shipping
                    </strong>
                    <p className="text-xs mt-1 leading-relaxed">
                      Upon winning the bid, the vehicle is transported to the port yard, certified by
                      JEVIC, and loaded on the next available vessel to Sri Lanka.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--accent)] space-y-2">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
                  Transparency Guarantee
                </span>
                <p className="text-xs font-light text-[var(--text-primary)] leading-relaxed">
                  You pay the true Japanese auction hammer price plus actual freight, insurance, and
                  Sri Lanka Customs duty, plus our fixed handling margin. Zero artificial price markups.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

