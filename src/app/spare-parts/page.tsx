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
import { PartsEnquiryForm } from "@/components/spare-parts/PartsEnquiryForm";

export const metadata: Metadata = {
  title: "Genuine Japanese Spare Parts | RS Enterprises Polonnaruwa",
  description:
    "Direct importer of authentic Japanese OEM and aftermarket spare parts for Toyota, Honda, Nissan, Mitsubishi, and Suzuki. Engine, hybrid batteries, suspension, and body panels in Kaduruwela, Polonnaruwa.",
  alternates: {
    canonical: "/spare-parts",
  },
  openGraph: {
    title: "Genuine Japanese Spare Parts | RS Enterprises",
    description:
      "Direct importer of authentic Japanese OEM and aftermarket spare parts. Kaduruwela, Polonnaruwa and Trincomalee.",
    url: "/spare-parts",
  },
};

const PARTS_CATEGORIES = [
  {
    code: "01",
    title: "Engine & Mechanical Assemblies",
    description:
      "Complete cylinder heads, camshafts, timing chain kits, high-pressure fuel pumps, water pumps, alternator units, and engine mounts sourced directly from Japan.",
    brands: "Toyota OEM, Denso, Aisin, NGK",
  },
  {
    code: "02",
    title: "Hybrid & EV Battery Systems",
    description:
      "Tested Japanese hybrid battery packs, individual cell modules, high-voltage inverters, DC-DC converters, and cooling blowers for Toyota Aqua, Prius, Axio, Vezel, and Harrier.",
    brands: "Panasonic, Primearth EV Energy (PEVE)",
  },
  {
    code: "03",
    title: "Suspension, Steering & Braking",
    description:
      "Heavy-duty shock absorbers, electronic steering racks, ball joints, control arms, brake calipers, vented rotors, and Japanese ceramic pads for Land Cruiser, Prado, and daily drivers.",
    brands: "KYB, Tokico, Akebono, Advics",
  },
  {
    code: "04",
    title: "Exterior Panels, Headlights & Mirrors",
    description:
      "Original factory bonnets, front & rear bumpers, bi-LED headlight assemblies, clear taillights, chrome grilles, and power-folding side mirrors with turn signals.",
    brands: "Koito, Stanley, Ichikoh, OEM Factory",
  },
  {
    code: "05",
    title: "Japanese Fluids & Genuine Consumables",
    description:
      "Genuine factory motor oils (0W-16, 0W-20, 5W-30), Toyota Castle oils, Honda Ultra HCF-2 / ATF DW-1, Super Long Life Coolant, and oil/cabin/air filters.",
    brands: "Toyota Castle, Honda Ultra, Nissan NS-3",
  },
];

export default async function SparePartsPage() {
  const settings = await getCompanySettings();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Spare Parts", href: "/spare-parts" },
  ];

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <Section variant="surface" className="pt-10 pb-16 border-b border-[var(--border-hairline)]">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 max-w-3xl space-y-4">
            <Eyebrow>Direct Japanese Spare Parts Importer</Eyebrow>
            <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
              Genuine OEM &amp; Aftermarket Japanese Parts
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed pt-2">
              Imported directly from licensed Tokyo and Osaka suppliers. We stock and indent
              factory components for Toyota, Honda, Nissan, Mitsubishi, and Suzuki, ensuring
              authentic performance, exact tolerances, and long-term durability.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="Parts WhatsApp Desk"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Kaduruwela Parts Counter"
            />
          </div>
        </Container>
      </Section>

      {/* Catalog Categories Section */}
      <Section className="py-16 sm:py-20">
        <Container size="wide">
          <div className="max-w-2xl mb-12">
            <Eyebrow>Specialized Inventory</Eyebrow>
            <Heading level={2} className="text-3xl sm:text-4xl mt-1">
              Component Classifications
            </Heading>
            <p className="text-sm font-light text-[var(--text-secondary)] mt-2">
              Both immediate showroom stock at Kaduruwela and rapid 10-14 day direct air/sea freight indent orders from Japan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PARTS_CATEGORIES.map((cat) => (
              <div
                key={cat.code}
                className="p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="font-mono text-xs font-semibold text-[var(--accent)] tracking-widest block">
                    CATEGORY {cat.code}
                  </span>
                  <Heading level={3} className="text-2xl font-serif">
                    {cat.title}
                  </Heading>
                  <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-[var(--border-hairline)]">
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                    Key Manufacturers
                  </span>
                  <span className="text-xs font-mono text-[var(--text-primary)] font-medium">
                    {cat.brands}
                  </span>
                </div>
              </div>
            ))}

            {/* Direct Japanese Indent Box */}
            <div className="p-8 bg-[var(--bg-base)] border border-[var(--accent)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-xs font-semibold text-[var(--accent)] tracking-widest block">
                  SPECIAL INDENT SERVICE
                </span>
                <Heading level={3} className="text-2xl font-serif">
                  Hard-To-Find &amp; Discontinued Parts
                </Heading>
                <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed">
                  Looking for rare Land Cruiser 70/80/100/200 series parts, JDM sports car components, or specialized diesel injectors? We source directly from Japan&apos;s secondary and dismantled parts auctions.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <span className="text-xs font-sans text-[var(--accent)] font-medium">
                  Air freight dispatch within 7-10 days
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Inquiry Form Section */}
      <Section variant="surface" className="py-20 border-t border-[var(--border-hairline)]">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <Eyebrow>Direct Parts Desk</Eyebrow>
              <Heading level={2} className="text-3xl sm:text-4xl font-normal leading-tight">
                Request Availability &amp; Quotation
              </Heading>
              <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
                To guarantee 100% fitment, please have your chassis or frame number ready (found on your vehicle registration document / revenue license).
              </p>

              <div className="p-6 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-3">
                <span className="text-xs font-mono font-medium text-[var(--accent)] uppercase tracking-wider block">
                  Delivery Across Sri Lanka
                </span>
                <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed">
                  Collect in person at our Kaduruwela main showroom or Trincomalee branch. Alternatively, we dispatch securely via registered courier (PromptX / Domex / Bus Parcel) to any destination in Sri Lanka.
                </p>
              </div>

              <div className="space-y-2 text-xs font-light text-[var(--text-secondary)]">
                <p>
                  <strong className="text-[var(--text-primary)] font-medium">Main Parts Counter:</strong>{" "}
                  {settings.mainBranch.address}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)] font-medium">Hours:</strong>{" "}
                  {settings.mainBranch.hours}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7 bg-[var(--bg-base)] border border-[var(--border-hairline)] p-8 sm:p-10">
              <div className="mb-6">
                <Eyebrow>Parts Specification</Eyebrow>
                <Heading level={3} className="text-2xl mt-1">
                  Submit Spare Parts Inquiry
                </Heading>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                  Our parts specialist will cross-reference Japanese electronic parts catalogs (EPC) and reply with pricing.
                </p>
              </div>

              <PartsEnquiryForm />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

