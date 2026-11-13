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
import { LeadEnquiryForm } from "@/components/vehicle-detail/LeadEnquiryForm";
import { MapFacade } from "@/components/contact/MapFacade";

export const metadata: Metadata = {
  title: "Contact & Showrooms | RS Enterprises Polonnaruwa",
  description:
    "Contact RS Enterprises Company Pvt Ltd. Kaduruwela main showroom in Polonnaruwa and Trincomalee coastal branch. Telephones, WhatsApp hotlines, directions, and direct import consultation.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Showrooms | RS Enterprises",
    description:
      "Kaduruwela main showroom and Trincomalee branch. Direct telephone and WhatsApp contacts for sales, spare parts, and vehicle imports.",
    url: "/contact",
  },
};

const FAQS = [
  {
    q: "Can I inspect the original Japanese auction sheet before making a deposit?",
    a: "Yes, without exception. We provide the unedited Japanese auction sheet directly from USS, TAA, or ARAI, complete with our English translation of all inspector marks, scratch/dent gradings, and mechanical remarks.",
  },
  {
    q: "How long does a direct vehicle import take from auction win to delivery?",
    a: "Typically 4 to 6 weeks. Following the auction win, inland Japanese transport to Yokohama or Kobe port takes 3-5 days, JEVIC/JAAI inspection takes 3 days, ocean carrier transit to Hambantota or Colombo takes approximately 14-18 days, and harbor customs clearing takes 4-7 days.",
  },
  {
    q: "How is payment structured for a custom Japanese import?",
    a: "Payment is staged transparently: an initial bidding deposit to initiate the search, followed by the CIF invoice payment upon auction confirmation, and final settlement of Sri Lanka Customs duties and port clearance fees once the vessel docks.",
  },
  {
    q: "Can I trade in my current vehicle at RS Enterprises?",
    a: "Yes. Bring your vehicle to our Kaduruwela showroom for an on-site physical evaluation. We evaluate the market value and apply the proceeds directly toward your new vehicle or issue an immediate settlement.",
  },
  {
    q: "Do you supply genuine spare parts to other areas in Sri Lanka?",
    a: "Yes. We stock spare parts at our Kaduruwela counter and deliver daily across the island (Colombo, Kandy, Kurunegala, Jaffna, Galle) using registered courier services.",
  },
];

export default async function ContactPage() {
  const settings = await getCompanySettings();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <main className="min-h-screen">
      {/* Editorial Header */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>Showroom Directory &amp; Enquiries</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              Visit Our Showrooms or Speak to an Advisor
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              Whether you are scheduling a private viewing at our Kaduruwela showroom,
              requesting an auction search from Japan, or inquiring about genuine spare parts,
              our team is at your service.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Direct WhatsApp Desk"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Kaduruwela Reception"
            />
          </div>
        </Container>
      </Section>

      {/* Showroom Locations Grid */}
      <Section className="py-16 sm:py-20 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <div className="max-w-2xl mb-12">
            <Eyebrow>Our Locations</Eyebrow>
            <Heading level={2} className="text-3xl sm:text-4xl mt-1">
              Provincial Showroom Network
            </Heading>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Kaduruwela Main Showroom */}
            <div className="p-8 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block mb-1">
                    PRIMARY HEADQUARTERS &amp; SHOWROOM
                  </span>
                  <Heading level={3} className="text-2xl sm:text-3xl font-serif">
                    Kaduruwela, Polonnaruwa
                  </Heading>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  Main Showroom
                </span>
              </div>

              <div className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                    Physical Address
                  </span>
                  <p className="text-[var(--text-primary)] font-normal text-base mt-0.5">
                    {settings.mainBranch.address}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    North Central Province, Sri Lanka
                  </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-[var(--border-hairline)]">
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                      Telephone Hotline
                    </span>
                    <a
                      href={`tel:${settings.mainBranch.phone}`}
                      className="text-xl sm:text-2xl font-mono font-light text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors mt-0.5 block tracking-tight"
                    >
                      {settings.mainBranch.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                      WhatsApp Line
                    </span>
                    <a
                      href={`https://wa.me/${settings.mainBranch.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg sm:text-xl font-mono font-light text-[var(--accent)] hover:underline mt-0.5 block tracking-tight"
                    >
                      {settings.mainBranch.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-hairline)]">
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                    Opening Hours
                  </span>
                  <p className="text-xs text-[var(--text-primary)] mt-0.5">
                    {settings.mainBranch.hours}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <WhatsAppButton
                  number={settings.mainBranch.whatsapp}
                  label="Message Kaduruwela Desk"
                />
                <PhoneLink
                  number={settings.mainBranch.phone}
                  displayNumber="Call Showroom"
                  variant="outline"
                />
              </div>
            </div>

            {/* Trincomalee Branch */}
            <div className="p-8 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block mb-1">
                    EASTERN PROVINCE EXPANSION
                  </span>
                  <Heading level={3} className="text-2xl sm:text-3xl font-serif">
                    Trincomalee Branch
                  </Heading>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--accent)]">
                  Expansion Branch
                </span>
              </div>

              <div className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                    Physical Address
                  </span>
                  <p className="text-[var(--text-primary)] font-normal text-base mt-0.5">
                    {settings.coastalBranch.address}
                  </p>
                  <p className="text-xs text-[var(--accent)] italic mt-0.5">
                    * Showroom facility details to be confirmed
                  </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-[var(--border-hairline)]">
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                      Branch Contact Hotline
                    </span>
                    <a
                      href={`tel:${settings.coastalBranch.phone}`}
                      className="text-xl sm:text-2xl font-mono font-light text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors mt-0.5 block tracking-tight"
                    >
                      {settings.coastalBranch.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
                      General Email
                    </span>
                    <a
                      href={`mailto:${settings.mainBranch.email}`}
                      className="text-base font-sans text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors mt-0.5 block"
                    >
                      {settings.mainBranch.email}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-hairline)]">
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                    Eastern Province Coverage
                  </span>
                  <p className="text-xs text-[var(--text-primary)] mt-0.5">
                    Serving Trincomalee, Batticaloa, Kinniya, and coastal communities.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <WhatsAppButton
                  number={settings.mainBranch.whatsapp}
                  label="Trincomalee Enquiries"
                />
                <PhoneLink
                  number={settings.coastalBranch.phone}
                  displayNumber="Call Trincomalee"
                  variant="outline"
                />
              </div>
            </div>
          </div>

          {/* Click-to-Load Map Facade: Preserves 95+ Lighthouse Score */}
          <div className="mt-12">
            <div className="mb-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block">
                Showroom Floor Location
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Directions to Kaduruwela Showroom
              </h3>
            </div>
            <MapFacade
              locationName="RS Enterprises Company Pvt Ltd (Kaduruwela)"
              address={settings.mainBranch.address}
              lat={settings.mainBranch.geo.lat}
              lng={settings.mainBranch.geo.lng}
            />
          </div>
        </Container>
      </Section>

      {/* General Contact Form & FAQ Section */}
      <Section variant="surface" className="py-20">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-[var(--bg-base)] border border-[var(--border-hairline)] p-8 sm:p-10">
              <div className="mb-6">
                <Eyebrow>Direct Message</Eyebrow>
                <Heading level={2} className="text-2xl sm:text-3xl mt-1">
                  Send a General Enquiry
                </Heading>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                  Our management team will review your message and reply via telephone or WhatsApp within showroom hours.
                </p>
              </div>

              <LeadEnquiryForm
                vehicleId="contact-page-inquiry"
                vehicleTitle="General Showroom Inquiry"
              />
            </div>

            {/* FAQs Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <Eyebrow>Buyer Guidance</Eyebrow>
                <Heading level={3} className="text-2xl sm:text-3xl mt-1">
                  Frequently Asked Questions
                </Heading>
              </div>

              <div className="space-y-4">
                {FAQS.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-2"
                  >
                    <h4 className="font-serif text-base text-[var(--text-primary)]">
                      {faq.q}
                    </h4>
                    <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
