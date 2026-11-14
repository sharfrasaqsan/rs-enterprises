import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Divider } from "@/components/ui/Divider";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { VehicleGallery } from "@/components/vehicle-detail/VehicleGallery";
import { LeadEnquiryForm } from "@/components/vehicle-detail/LeadEnquiryForm";
import { MobileVehicleStickyBar } from "@/components/vehicle-detail/MobileVehicleStickyBar";
import { VehicleCompareCheckbox } from "@/components/vehicles/VehicleCompareCheckbox";
import { LazyCompareTray } from "@/components/vehicles/LazyCompareTray";
import {
  getAllPublishedVehicles,
  getVehicleBySlug,
  getRelated,
} from "@/lib/vehicles";
import { getCompanySettings } from "@/lib/settings";

export async function generateStaticParams() {
  const vehicles = await getAllPublishedVehicles();
  return vehicles.map((v) => ({
    slug: v.slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle || !vehicle.published) {
    return {
      title: "Vehicle Not Found | RS Enterprises",
      description: "The requested vehicle record could not be found.",
    };
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} - Grade ${vehicle.grade}`;
  const description =
    vehicle.description ||
    `Verified imported ${vehicle.year} ${vehicle.make} ${vehicle.model}. Mileage: ${vehicle.mileage}km. Fuel: ${vehicle.fuel}. Available at RS Enterprises Kaduruwela showroom.`;

  return {
    title: `${title} | RS Enterprises`,
    description,
    alternates: {
      canonical: `/vehicles/${vehicle.slug}`,
    },
    openGraph: {
      title: `${title} | RS Enterprises Company Pvt Ltd`,
      description,
      url: `https://rsenterprises.lk/vehicles/${vehicle.slug}`,
      images: vehicle.images.length > 0 ? [{ url: vehicle.images[0] }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | RS Enterprises`,
      description,
      images: vehicle.images.length > 0 ? [vehicle.images[0]] : [],
    },
  };
}

export default async function VehicleDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const [vehicle, settings] = await Promise.all([
    getVehicleBySlug(slug),
    getCompanySettings(),
  ]);

  if (!vehicle || !vehicle.published) {
    notFound();
  }

  const relatedVehicles = await getRelated(vehicle, 3);
  const isSold = vehicle.status === "sold";
  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const canonicalUrl = `https://rsenterprises.lk/vehicles/${vehicle.slug}`;

  // WhatsApp prefilled message
  const waInquiryMessage = `Hello RS Enterprises, I am inquiring regarding the ${vehicleTitle} listed at ${canonicalUrl}. Could you please share the inspection sheet and latest availability?`;

  // Structured Data (JSON-LD): Car + Offer schema
  const carJsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleTitle,
    image: vehicle.images,
    brand: {
      "@type": "Brand",
      name: vehicle.make,
    },
    model: vehicle.model,
    modelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    fuelType: vehicle.fuel,
    vehicleTransmission: vehicle.transmission,
    color: vehicle.color,
    description: vehicle.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: vehicle.price ? String(vehicle.price) : undefined,
      availability: isSold
        ? "https://schema.org/SoldOut"
        : vehicle.status === "incoming"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "AutoDealer",
        name: "RS Enterprises Company Pvt Ltd",
        telephone: settings.mainBranch.phone,
      },
    },
  };

  // Structured Data (JSON-LD): BreadcrumbList schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://rsenterprises.lk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Vehicles",
        item: "https://rsenterprises.lk/vehicles",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: vehicleTitle,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(carJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-24 sm:pb-32">
        {/* Top Breadcrumbs & Utility Bar */}
        <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] py-3">
          <Container size="wide">
            <div className="flex items-center justify-between gap-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Showroom Inventory", href: "/vehicles" },
                  { label: vehicle.make, href: `/vehicles?make=${vehicle.make}` },
                  { label: vehicleTitle },
                ]}
              />
              <div className="hidden sm:flex items-center space-x-3">
                <VehicleCompareCheckbox slug={vehicle.slug} title={vehicleTitle} />
              </div>
            </div>
          </Container>
        </div>

        {/* Vehicle Dossier Hero Header */}
        <div className="pt-8 sm:pt-12 pb-6 border-b border-[var(--border-hairline)]">
          <Container size="wide">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusLabel status={vehicle.status} />
                <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-wider">
                  Grade {vehicle.grade} &bull; Auction Sheet Verified
                </span>
                {vehicle.expectedArrival && (
                  <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    ETA: {vehicle.expectedArrival}
                  </span>
                )}
              </div>

              {/* Large Serif Title */}
              <Heading level={1} className="max-w-4xl">
                {vehicleTitle}
              </Heading>
            </div>
          </Container>
        </div>

        {/* Main 12-Column Dossier Content */}
        <div className="pt-8 sm:pt-12">
          <Container size="wide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column (7 cols): Full-Bleed Gallery & Technical Dossier */}
              <div className="lg:col-span-7 space-y-12">
                {/* 1. Opening Full-Bleed Gallery */}
                <VehicleGallery images={vehicle.images} title={vehicleTitle} slug={vehicle.slug} />

                {/* 2. Key Figures (Large Light-weight Numerals) */}
                <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-6">
                  <Eyebrow>Technical Summary</Eyebrow>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Numeral
                      value={vehicle.mileage.toLocaleString()}
                      suffix="km"
                      label="Certified Mileage"
                      size="md"
                    />
                    <Numeral
                      value={vehicle.engineCC.toLocaleString()}
                      suffix="cc"
                      label="Engine Displacement"
                      size="md"
                    />
                    <Numeral
                      value={vehicle.fuel.toUpperCase()}
                      label="Powertrain"
                      size="md"
                    />
                    <Numeral
                      value={vehicle.transmission.toUpperCase()}
                      label="Transmission"
                      size="md"
                    />
                  </div>
                </div>

                {/* 3. Detailed Specifications List (Two-Column with Hairlines) */}
                <div className="space-y-6">
                  <div className="border-b border-[var(--border-hairline)] pb-3">
                    <Eyebrow>Factory Dossier &bull; Specifications</Eyebrow>
                    <Heading level={3} className="mt-1">
                      Comprehensive Vehicle Specifications
                    </Heading>
                  </div>

                  <div className="border-t border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)] text-xs font-sans">
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Manufacturer / Brand</span>
                      <span className="text-[var(--text-primary)] font-medium">{vehicle.make}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Model Range</span>
                      <span className="text-[var(--text-primary)] font-medium">{vehicle.model}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Year of Manufacture</span>
                      <span className="text-[var(--text-primary)] font-medium tabular-nums">{vehicle.year}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Auction Inspection Grade</span>
                      <span className="text-[var(--text-primary)] font-medium">{vehicle.grade}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Engine Displacement</span>
                      <span className="text-[var(--text-primary)] font-medium tabular-nums">{vehicle.engineCC} CC</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Fuel System</span>
                      <span className="text-[var(--text-primary)] font-medium uppercase">{vehicle.fuel}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Gearbox / Transmission</span>
                      <span className="text-[var(--text-primary)] font-medium uppercase">{vehicle.transmission}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Exterior Paint</span>
                      <span className="text-[var(--text-primary)] font-medium">{vehicle.color}</span>
                    </div>
                    <div className="py-3.5 grid grid-cols-2">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider">Showroom Availability</span>
                      <span className="text-[var(--text-primary)] font-medium uppercase">{vehicle.status}</span>
                    </div>
                    {vehicle.importStage && (
                      <div className="py-3.5 grid grid-cols-2">
                        <span className="text-[var(--text-muted)] uppercase tracking-wider">Import Logistics Stage</span>
                        <span className="text-[var(--accent)] font-medium uppercase">{vehicle.importStage.replace("_", " ")}</span>
                      </div>
                    )}
                    {vehicle.expectedArrival && (
                      <div className="py-3.5 grid grid-cols-2">
                        <span className="text-[var(--text-muted)] uppercase tracking-wider">Expected Arrival (ETA)</span>
                        <span className="text-[var(--text-primary)] font-medium tabular-nums">{vehicle.expectedArrival}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Equipment & Features List */}
                {vehicle.features.length > 0 && (
                  <div className="space-y-4">
                    <Eyebrow>Factory Equipment</Eyebrow>
                    <Heading level={3}>
                      Installed Options &amp; Features
                    </Heading>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {vehicle.features.map((feat) => (
                        <div
                          key={feat}
                          className="flex items-center space-x-2.5 p-3 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-xs text-[var(--text-primary)]"
                        >
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--accent)] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Editorial Description */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-hairline)]">
                  <Eyebrow>Director&apos;s Notes</Eyebrow>
                  <p className="text-sm sm:text-base font-light text-[var(--text-secondary)] leading-relaxed">
                    {vehicle.description}
                  </p>
                </div>
              </div>

              {/* Right Column (5 cols): Sticky Desk Panel with Price & Form */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                {/* Price & Primary Action Box */}
                <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] space-y-6 shadow-none">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] block">
                      Showroom Valuation
                    </span>
                    <div>
                      {vehicle.price ? (
                        <Numeral
                          value={vehicle.price.toLocaleString("en-US")}
                          prefix="LKR"
                          label={isSold ? "Sold Price Record" : "Kaduruwela Showroom Price"}
                          size="xl"
                        />
                      ) : (
                        <div className="space-y-1">
                          <span className="font-serif text-3xl font-light text-[var(--accent)] block">
                            Call For Price
                          </span>
                          <span className="text-xs text-[var(--text-muted)] block">
                            Duty concession &amp; CIF direct import valuation available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider variant="hairline" />

                  {/* Primary Direct CTAs */}
                  {!isSold ? (
                    <div className="space-y-3">
                      <WhatsAppButton
                        message={waInquiryMessage}
                        label="Inquire via WhatsApp"
                        className="w-full text-center"
                      />
                      <PhoneLink
                        number={settings.mainBranch.phone}
                        displayNumber={settings.mainBranch.phone}
                        label="Call Showroom Hotline"
                        variant="outline"
                        className="w-full text-center"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-center space-y-2">
                      <span className="text-xs font-mono uppercase font-bold text-[var(--status-sold)]">
                        Vehicle Sold &bull; Unit Delivered
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] font-light">
                        This specific chassis has been delivered. We can source an identical
                        specification directly from upcoming Tokyo auctions.
                      </p>
                    </div>
                  )}

                  {/* Compare Action */}
                  <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <VehicleCompareCheckbox slug={vehicle.slug} title={vehicleTitle} />
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Stock #{vehicle.id.slice(0, 10).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Short Lead Inquiry Form */}
                <LeadEnquiryForm
                  vehicleId={vehicle.id}
                  vehicleTitle={vehicleTitle}
                />

                {/* Showroom Authenticity Guarantee Badge */}
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-2 text-xs font-light text-[var(--text-secondary)]">
                  <div className="flex items-center space-x-2 text-[var(--accent)] font-medium">
                    <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="uppercase tracking-wider text-[11px]">Certified Provenance</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Includes original Japanese export certificate, verified odometer reading,
                    and USS/TAA auction inspection records.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Related Vehicles Section */}
        {relatedVehicles.length > 0 && (
          <div className="mt-20 pt-16 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/50">
            <Container size="wide">
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <Eyebrow>Showroom Alternatives</Eyebrow>
                    <Heading level={2} className="mt-1">
                      Similar Vehicles in Showroom
                    </Heading>
                  </div>
                  <Link
                    href="/vehicles"
                    className="text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--accent)] hover:underline"
                  >
                    All Inventory &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedVehicles.map((rel) => (
                    <article
                      key={rel.id}
                      className="bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <Link href={`/vehicles/${rel.slug}`} className="block group">
                          <VehicleImage
                            src={rel.images[0] || "/images/vehicles/sample-prado.svg"}
                            alt={`${rel.year} ${rel.make} ${rel.model}`}
                            aspectRatio="16/10"
                          />
                        </Link>
                        <div className="flex items-center justify-between">
                          <StatusLabel status={rel.status} />
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {rel.year} &bull; {rel.fuel}
                          </span>
                        </div>
                        <Link href={`/vehicles/${rel.slug}`} className="block group">
                          <Heading level={4} className="group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                            {rel.make} {rel.model}
                          </Heading>
                        </Link>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-hairline)] flex items-baseline justify-between">
                        <div>
                          {rel.price ? (
                            <Numeral
                              value={rel.price.toLocaleString("en-US")}
                              prefix="LKR"
                              size="sm"
                            />
                          ) : (
                            <span className="text-xs font-sans uppercase tracking-widest text-[var(--accent)]">
                              Call For Price
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/vehicles/${rel.slug}`}
                          className="text-xs font-sans uppercase font-medium tracking-wider text-[var(--accent)] hover:underline"
                        >
                          Specs &rarr;
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </Container>
          </div>
        )}
      </div>

      {/* Sticky Quick Contact Bar for Mobile */}
      <MobileVehicleStickyBar
        vehicle={vehicle}
        whatsappNumber={settings.mainBranch.whatsapp}
        phoneNumber={settings.mainBranch.phone}
      />

      {/* Floating Compare Tray */}
      <LazyCompareTray />
    </>
  );
}
