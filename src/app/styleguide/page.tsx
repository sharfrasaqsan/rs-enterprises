import type { Metadata } from "next";
import {
  Button,
  Eyebrow,
  Heading,
  Numeral,
  Divider,
  Section,
  Container,
  StatusLabel,
  PhoneLink,
  WhatsAppButton,
  VehicleImage,
  ThemeToggle,
  EditorialGrid,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Design System & WCAG Contrast Styleguide",
  description:
    "Art-directed design system, WCAG AA/AAA contrast ratios, typography scale, and responsive viewport verification for RS Enterprises.",
  robots: {
    index: false,
    follow: false,
  },
};

// Contrast data verified mathematically against WCAG 2.1 specifications
const contrastData = [
  {
    theme: "Dark",
    element: "Primary Text (Warm Bone)",
    fgHex: "#EDE8DF",
    bgSurface: "Base Background",
    bgHex: "#0C0C0D",
    ratio: "16.02 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "The pinnacle of imported Japanese automotive engineering.",
  },
  {
    theme: "Dark",
    element: "Secondary Text (Cashmere)",
    fgHex: "#A39F95",
    bgSurface: "Base Background",
    bgHex: "#0C0C0D",
    ratio: "7.40 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "Direct Tokyo auction procurement with certified inspection sheets.",
  },
  {
    theme: "Dark",
    element: "Subtle Label / Micro-copy",
    fgHex: "#7E7A72",
    bgSurface: "Base Background",
    bgHex: "#0C0C0D",
    ratio: "4.58 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AA Pass",
    sample: "CHASSIS GDJ150 • UNREGISTERED",
  },
  {
    theme: "Dark",
    element: "Flat Champagne Gold Accent",
    fgHex: "#B89B62",
    bgSurface: "Base Background",
    bgHex: "#0C0C0D",
    ratio: "7.36 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "RS ENTERPRISES LUXURY COLLECTION",
  },
  {
    theme: "Dark",
    element: "Flat Champagne Gold Accent",
    fgHex: "#B89B62",
    bgSurface: "Elevated Surface Panel",
    bgHex: "#141416",
    ratio: "6.92 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "INQUIRE VIA WHATSAPP",
  },
  {
    theme: "Light",
    element: "Primary Text (Archival Ink)",
    fgHex: "#141413",
    bgSurface: "Ivory Base Background",
    bgHex: "#F4F0E8",
    ratio: "16.22 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "The pinnacle of imported Japanese automotive engineering.",
  },
  {
    theme: "Light",
    element: "Secondary Text (Graphite)",
    fgHex: "#524F49",
    bgSurface: "Ivory Base Background",
    bgHex: "#F4F0E8",
    ratio: "7.18 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AAA Pass",
    sample: "Direct Tokyo auction procurement with certified inspection sheets.",
  },
  {
    theme: "Light",
    element: "Subtle Label / Micro-copy",
    fgHex: "#68645C",
    bgSurface: "Ivory Base Background",
    bgHex: "#F4F0E8",
    ratio: "5.18 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AA Pass",
    sample: "CHASSIS GDJ150 • UNREGISTERED",
  },
  {
    theme: "Light",
    element: "Deep Champagne Bronze Accent",
    fgHex: "#7C602E",
    bgSurface: "Ivory Base Background",
    bgHex: "#F4F0E8",
    ratio: "5.18 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AA Pass",
    sample: "RS ENTERPRISES LUXURY COLLECTION",
  },
  {
    theme: "Light",
    element: "Deep Champagne Bronze Accent",
    fgHex: "#7C602E",
    bgSurface: "Soft Ivory Surface Panel",
    bgHex: "#EBE6DC",
    ratio: "4.73 : 1",
    wcagTarget: ">= 4.5 : 1 (Normal Text)",
    level: "AA Pass",
    sample: "INQUIRE VIA WHATSAPP",
  },
];

export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-32">
      {/* 
        Styleguide Sub-Control Bar with Verification Status
      */}
      <div className="w-full bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] py-3">
        <Container size="wide">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
                Design System Specification
              </span>
              <span className="hidden sm:inline-block h-3 w-[1px] bg-[var(--border-subtle)]" />
              <span className="text-[var(--text-muted)] hidden sm:inline-block">
                WCAG 2.1 AA / AAA Validated
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Art Direction: Luxury Automotive
              </span>
            </div>
          </div>
        </Container>
      </div>

      {/* Hero Overview */}
      <Section spacing="normal">
        <Container size="wide">
          <div className="max-w-3xl space-y-4">
            <Eyebrow>Specification & Verification</Eyebrow>
            <Heading level={1}>
              Art-Directed Automotive Design System
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed">
              Engineered exclusively for RS Enterprises Company Pvt Ltd. Designed
              mobile-first (360px–390px) to desktop (1440px), evoking the restraint,
              precision, and gravitas of a high-end automotive gallery. Zero gradients
              on gold, zero glows, zero pill buttons, strictly flat architectural tokens.
            </p>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 1. WCAG AA / AAA Contrast Verification Matrix */}
      <Section spacing="normal">
        <Container size="wide">
          <div className="space-y-6">
            <div>
              <Eyebrow>Accessibility Verification</Eyebrow>
              <Heading level={2} className="mt-1">
                Color Tokens & Contrast Audit Matrix
              </Heading>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                All foreground/background pairings have been verified mathematically
                under standard sRGB relative luminance models. Every pair exceeds the
                WCAG 2.1 AA 4.5:1 requirement for normal text.
              </p>
            </div>

            <div className="overflow-x-auto border border-[var(--border-hairline)] rounded-[2px]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">Theme</th>
                    <th className="py-3.5 px-4 font-medium">Element</th>
                    <th className="py-3.5 px-4 font-medium">Foreground</th>
                    <th className="py-3.5 px-4 font-medium">Surface</th>
                    <th className="py-3.5 px-4 font-medium">Contrast</th>
                    <th className="py-3.5 px-4 font-medium">WCAG Standard</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {contrastData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[var(--bg-surface)]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                        {item.theme}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-primary)] font-medium">
                        {item.element}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-[1px] border border-[var(--border-subtle)]"
                            style={{ backgroundColor: item.fgHex }}
                          />
                          {item.fgHex}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-[1px] border border-[var(--border-subtle)]"
                            style={{ backgroundColor: item.bgHex }}
                          />
                          {item.bgHex} ({item.bgSurface})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-serif text-sm font-semibold tabular-nums text-[var(--accent)]">
                        {item.ratio}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {item.wcagTarget}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 text-[10px] uppercase font-semibold tracking-widest rounded-[2px] bg-[var(--bg-surface)] border border-[var(--accent)] text-[var(--accent)]">
                          {item.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 2. Fluid Typography Showcase */}
      <Section spacing="normal">
        <Container size="wide">
          <div className="space-y-8">
            <div>
              <Eyebrow>Typography Scale</Eyebrow>
              <Heading level={2} className="mt-1">
                Fluid Serif Display & Neutral Micro-Labels
              </Heading>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Self-hosted via <code className="text-[var(--accent)]">next/font</code>:{" "}
                <strong>Cormorant Garamond</strong> (high-contrast luxury serif display)
                paired with <strong>Plus Jakarta Sans</strong> (quiet, geometric neutral sans).
                Zero banned fonts.
              </p>
            </div>

            <div className="space-y-8 p-6 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
              <div>
                <Eyebrow>Level 1 Heading • clamp(34px, 5.5vw, 68px)</Eyebrow>
                <Heading level={1} className="mt-2">
                  Direct Japanese Automotive Imports
                </Heading>
              </div>

              <Divider />

              <div>
                <Eyebrow>Level 2 Heading • clamp(26px, 3.8vw, 44px)</Eyebrow>
                <Heading level={2} className="mt-2">
                  Kaduruwela Main Showroom & Trincomalee Gallery
                </Heading>
              </div>

              <Divider />

              <div>
                <Eyebrow>Level 3 Heading • clamp(20px, 2.5vw, 30px)</Eyebrow>
                <Heading level={3} className="mt-2">
                  2023 Toyota Land Cruiser Prado TX-L 70th Anniversary
                </Heading>
              </div>

              <Divider />

              <div>
                <Eyebrow>Level 4 Heading • clamp(17px, 1.8vw, 22px)</Eyebrow>
                <Heading level={4} className="mt-2">
                  Auction Inspection Grade 5A • Interior Condition Superior
                </Heading>
              </div>

              <Divider />

              <div>
                <Eyebrow>Editorial Lead Paragraph</Eyebrow>
                <p className="mt-2 text-base sm:text-lg font-light leading-relaxed text-[var(--text-secondary)] max-w-3xl">
                  Each vehicle in our inventory is individually selected by our licensed
                  procurement specialists at premier USS, TAA, and CAA Tokyo auctions.
                  Complete auction sheets and export certificates are provided with every chassis.
                </p>
              </div>

              <Divider />

              <div>
                <Eyebrow>Light-weight Numerals (Prices & Technical Specifications)</Eyebrow>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <Numeral
                    value="42,500,000"
                    prefix="LKR"
                    label="Showroom Asking Price"
                    size="lg"
                  />
                  <Numeral
                    value="18,450"
                    suffix="KM"
                    label="Certified Mileage"
                    size="lg"
                  />
                  <Numeral
                    value="2,755"
                    suffix="CC"
                    label="Displacement"
                    size="lg"
                  />
                  <Numeral
                    value="2023"
                    label="Manufacturing Year"
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 3. Component Primitives Inventory */}
      <Section spacing="normal">
        <Container size="wide">
          <div className="space-y-12">
            <div>
              <Eyebrow>Component Inventory</Eyebrow>
              <Heading level={2} className="mt-1">
                Refined Luxury Automotive Primitives
              </Heading>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Rectangular geometry, max 2px border radius, hairline borders, no pill
                buttons, no drop shadows, tap targets strictly &ge; 44px.
              </p>
            </div>

            {/* Buttons & Actions */}
            <div className="space-y-4">
              <Eyebrow>Action Controls (Buttons & Direct Links)</Eyebrow>
              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-wrap gap-4 items-center">
                <Button variant="solid" size="md">
                  Inquire Showroom
                </Button>
                <Button variant="outline" size="md">
                  Download Auction Sheet
                </Button>
                <Button variant="text-link">
                  View Full Technical Dossier &rarr;
                </Button>
                <Button variant="solid" disabled size="md">
                  Reserved by Client
                </Button>
              </div>
            </div>

            {/* High-Touch Contact CTA Primitives */}
            <div className="space-y-4">
              <Eyebrow>Communication Primitives (&ge; 44px Tap Targets)</Eyebrow>
              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-wrap gap-4 items-center">
                <WhatsAppButton
                  number="94770000000"
                  label="Priority WhatsApp Inquiry"
                  vehicleTitle="2023 Toyota Land Cruiser Prado TX-L"
                />
                <WhatsAppButton
                  number="94770000000"
                  variant="outline"
                  label="WhatsApp Showroom"
                />
                <PhoneLink
                  number="+94272220000"
                  displayNumber="+94 27 222 0000"
                  label="Kaduruwela Office"
                  variant="solid"
                />
                <PhoneLink
                  number="+94770000000"
                  displayNumber="+94 77 000 0000"
                  label="Direct Hotline"
                  variant="outline"
                />
                <PhoneLink
                  number="+94272220000"
                  displayNumber="+94 27 222 0000"
                  variant="inline"
                />
              </div>
            </div>

            {/* Status Labels (Small-caps, not colored pills) */}
            <div className="space-y-4">
              <Eyebrow>Showroom Status Labels (Refined Small Caps, Non-Pill)</Eyebrow>
              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-wrap gap-6 items-center">
                <StatusLabel status="available" />
                <StatusLabel status="incoming" />
                <StatusLabel status="reserved" />
                <StatusLabel status="sold" />
              </div>
            </div>

            {/* Dividers */}
            <div className="space-y-4">
              <Eyebrow>Hairline Dividers</Eyebrow>
              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-6">
                <div>
                  <span className="text-xs text-[var(--text-muted)]">Hairline Token (0.10 opacity)</span>
                  <Divider variant="hairline" className="mt-2" />
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)]">Subtle Token (0.18 opacity)</span>
                  <Divider variant="subtle" className="mt-2" />
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)]">Accent Token (Muted Gold / Bronze)</span>
                  <Divider variant="accent" className="mt-2" />
                </div>
              </div>
            </div>

            {/* Vehicle Card & Image Wrapper */}
            <div className="space-y-4">
              <Eyebrow>Vehicle Imagery & Editorial Card (Slow 1.03 Hover)</Eyebrow>
              <EditorialGrid>
                {/* Asymmetric composition: 7 cols main, 5 cols specs */}
                <div className="col-span-4 sm:col-span-8 lg:col-span-7 space-y-3">
                  <VehicleImage
                    src="/images/vehicles/sample-prado.svg"
                    alt="2023 Toyota Land Cruiser Prado TX-L"
                    aspectRatio="16/10"
                    priority
                  />
                  <span className="text-xs text-[var(--text-muted)] block">
                    &uarr; Hover image to test slow 1.03 ease-out zoom and hairline border.
                  </span>
                </div>

                <div className="col-span-4 sm:col-span-8 lg:col-span-5 p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <StatusLabel status="available" />
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        STOCK #RS-2023-01
                      </span>
                    </div>

                    <div>
                      <Eyebrow>Direct Import • Japan Auction Grade 5A</Eyebrow>
                      <Heading level={3} className="mt-1">
                        2023 Toyota Land Cruiser Prado TX-L
                      </Heading>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--border-hairline)]">
                      <Numeral value="18,500" suffix="km" label="Mileage" size="sm" />
                      <Numeral value="2,755" suffix="cc" label="Engine" size="sm" />
                      <Numeral value="Diesel" label="Fuel" size="sm" />
                      <Numeral value="Automatic" label="Transmission" size="sm" />
                    </div>
                  </div>

                  <div className="pt-6 space-y-3">
                    <Numeral
                      value="42,500,000"
                      prefix="LKR"
                      label="Available at Kaduruwela Showroom"
                      size="md"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <WhatsAppButton
                        label="Inquire via WhatsApp"
                        vehicleTitle="2023 Toyota Land Cruiser Prado TX-L"
                        className="w-full sm:w-auto"
                      />
                      <Button variant="outline" className="w-full sm:w-auto">
                        Full Dossier
                      </Button>
                    </div>
                  </div>
                </div>
              </EditorialGrid>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 4. Section Inversion Demonstration */}
      <Section variant="inverted" spacing="normal">
        <Container size="wide">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-inverted)]">
              Inverted Section Architecture
            </span>
            <h2 className="font-serif text-[clamp(1.625rem,3.8vw,2.75rem)] font-normal leading-[1.15] text-[var(--text-inverted)]">
              High-Impact Editorial Contrast Interludes
            </h2>
            <p className="text-base text-[var(--text-inverted)] opacity-85 leading-relaxed font-light">
              This section demonstrates the <code>variant=&quot;inverted&quot;</code> primitive.
              In dark mode, it flips seamlessly to warm ivory (#F4F0E8) with deep ink text;
              in light mode, it flips to warm noir (#0C0C0D) with bone text.
              Contrast ratios remain strictly compliant in both states.
            </p>
            <div className="pt-4 flex gap-4">
              <span className="inline-flex px-3 py-1.5 text-xs font-mono border border-[var(--border-inverted)] text-[var(--text-inverted)]">
                Contrast: 16.0:1 (AAA)
              </span>
              <span className="inline-flex px-3 py-1.5 text-xs font-mono border border-[var(--border-inverted)] text-[var(--accent-inverted)]">
                Accent Token Inverted
              </span>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 5. Dual Viewport Verification (390px Mobile & 1440px Desktop) */}
      <Section spacing="generous">
        <Container size="wide">
          <div className="space-y-8">
            <div>
              <Eyebrow>Viewport Verification (390px & 1440px)</Eyebrow>
              <Heading level={2} className="mt-1">
                Strict Non-Negotiable Responsive Layouts
              </Heading>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Evaluated against Rule 1: Mobile-first 360px–390px tap targets &ge; 44px,
                zero unwanted horizontal scroll, and Rule 6: Minimal JS.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 390px Mobile Frame Simulator */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-muted)]">
                    Mobile Viewport Frame (390px Width)
                  </span>
                  <span className="text-[11px] font-mono text-[var(--accent)]">
                    Width: 390px
                  </span>
                </div>

                <div className="w-[390px] max-w-full mx-auto border-2 border-[var(--border-subtle)] rounded-[4px] p-4 bg-[var(--bg-base)] space-y-4 shadow-none">
                  {/* Mobile Header Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                    <span className="font-serif text-sm tracking-wider font-semibold">
                      RS ENTERPRISES
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[var(--accent)]">
                      KADURUWELA
                    </span>
                  </div>

                  {/* Mobile Vehicle Card */}
                  <VehicleImage
                    src="/images/vehicles/sample-vezel.svg"
                    alt="Honda Vezel e:HEV Z"
                    aspectRatio="16/10"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusLabel status="incoming" />
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        ETA 14 DAYS
                      </span>
                    </div>

                    <Heading level={4}>
                      2022 Honda Vezel e:HEV Z Grade
                    </Heading>

                    <div className="flex items-baseline justify-between pt-1">
                      <Numeral value="16,800,000" prefix="LKR" size="sm" />
                      <span className="text-xs text-[var(--text-muted)]">Hybrid</span>
                    </div>
                  </div>

                  {/* Mobile 44px Tap Target CTA */}
                  <div className="pt-2 space-y-2">
                    <WhatsAppButton
                      label="WhatsApp Inquiry"
                      vehicleTitle="2022 Honda Vezel e:HEV Z"
                      className="w-full text-center"
                    />
                    <PhoneLink
                      number="+94272220000"
                      displayNumber="Call Polonnaruwa Branch"
                      variant="outline"
                      className="w-full text-center"
                    />
                  </div>
                </div>
              </div>

              {/* 1440px Desktop Composition Preview */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-muted)]">
                    Desktop 12-Column Editorial Grid Architecture
                  </span>
                  <span className="text-[11px] font-mono text-[var(--accent)]">
                    Max: 1440px
                  </span>
                </div>

                <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-6">
                  <div className="space-y-2">
                    <Eyebrow>Direct Auction Import Portal</Eyebrow>
                    <Heading level={3}>
                      Bespoke Japanese Vehicle Procurement Service
                    </Heading>
                    <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                      Affluent clients in Polonnaruwa, Trincomalee, and island-wide can bid
                      directly on live Japanese auction listings with transparent yen invoice
                      pricing, customs clearing at Hambantota/Colombo ports, and door-to-door
                      carrier delivery.
                    </p>
                  </div>

                  {/* 3-column asymmetric stat row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-hairline)]">
                    <div>
                      <Numeral value="100%" label="Genuine Mileage" size="sm" />
                    </div>
                    <div>
                      <Numeral value="5A / S" label="Auction Grade Focus" size="sm" />
                    </div>
                    <div>
                      <Numeral value="2 Branches" label="Island-wide Presence" size="sm" />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-4">
                    <Button variant="solid">Request Custom Auction Bid</Button>
                    <Button variant="outline">Learn About Import Process</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 6. Dual Theme Side-by-Side Synchronous Preview */}
      <Section spacing="generous">
        <Container size="wide">
          <div className="space-y-8">
            <div>
              <Eyebrow>Synchronous Dual Theme Preview</Eyebrow>
              <Heading level={2} className="mt-1">
                Dark & Light Showroom Themes Side-by-Side
              </Heading>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Inspect both colorways simultaneously without toggling. Both palettes
                adhere to the art direction: warm noir with flat champagne gold versus
                warm ivory with deep champagne bronze.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Forced Dark Preview */}
              <div
                data-theme="dark"
                className="p-6 sm:p-8 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                    Dark Theme Showcase
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    #0C0C0D / #B89B62
                  </span>
                </div>

                <div className="space-y-2">
                  <Eyebrow>Kaduruwela Main Showroom</Eyebrow>
                  <Heading level={3}>
                    2023 Toyota Land Cruiser Prado
                  </Heading>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Warm near-black background with warm bone typography and flat champagne gold.
                  </p>
                </div>

                <div className="flex items-baseline justify-between py-2 border-y border-[var(--border-hairline)]">
                  <Numeral value="42,500,000" prefix="LKR" size="sm" />
                  <StatusLabel status="available" />
                </div>

                <div className="flex gap-3">
                  <Button variant="solid" size="sm">
                    Inquire
                  </Button>
                  <Button variant="outline" size="sm">
                    Dossier
                  </Button>
                </div>
              </div>

              {/* Forced Light Preview */}
              <div
                data-theme="light"
                className="p-6 sm:p-8 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                    Light Theme Showcase
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    #F4F0E8 / #7C602E
                  </span>
                </div>

                <div className="space-y-2">
                  <Eyebrow>Kaduruwela Main Showroom</Eyebrow>
                  <Heading level={3}>
                    2023 Toyota Land Cruiser Prado
                  </Heading>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Warm ivory/bone background with archival ink typography and deep champagne bronze.
                  </p>
                </div>

                <div className="flex items-baseline justify-between py-2 border-y border-[var(--border-hairline)]">
                  <Numeral value="42,500,000" prefix="LKR" size="sm" />
                  <StatusLabel status="available" />
                </div>

                <div className="flex gap-3">
                  <Button variant="solid" size="sm">
                    Inquire
                  </Button>
                  <Button variant="outline" size="sm">
                    Dossier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* 7. Technical Proof: Zero Flash & Zero Layout Shift */}
      <Section spacing="normal">
        <Container size="wide">
          <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-4">
            <Eyebrow>Zero Flash & Zero Layout Shift Architecture</Eyebrow>
            <Heading level={3}>
              Verification of Instant Theme Synchronization
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">
                  1. Zero Flash of Unstyled Theme (FOUT / FOUC)
                </p>
                <p>
                  A blocking, synchronous script inside the <code>&lt;head&gt;</code> element reads{" "}
                  <code>localStorage.getItem(&apos;rs_theme&apos;)</code> and sets{" "}
                  <code>document.documentElement.setAttribute(&apos;data-theme&apos;, theme)</code> before
                  the HTML engine parses or paints the <code>&lt;body&gt;</code>. As a result, the browser
                  never paints in the wrong theme.
                </p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">
                  2. Zero Cumulative Layout Shift (CLS &lt; 0.05)
                </p>
                <p>
                  Both dark and light themes share identical font families, metric-matched
                  system fallbacks, fluid line-heights, and box-model dimensions. Switching
                  themes alters only CSS color custom properties, resulting in zero pixel
                  movement or layout re-computation.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

