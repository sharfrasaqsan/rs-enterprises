import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Vehicle } from "@/types/vehicle";
import { CompanySettings } from "@/types/settings";

export function Hero({
  featuredVehicle,
  settings,
}: {
  featuredVehicle: Vehicle;
  settings: CompanySettings;
}) {
  const heroImage = featuredVehicle.images[0] || "/images/vehicles/sample-prado.svg";
  const formattedPrice = featuredVehicle.price
    ? (featuredVehicle.price).toLocaleString("en-US")
    : null;

  const cleanWa = settings.mainBranch.whatsapp.replace(/[^0-9]/g, "");
  const waInquiryUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Hello RS Enterprises, I am inquiring regarding the featured ${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model} on your showroom homepage.`
  )}`;

  return (
    <section className="relative w-full bg-[var(--bg-base)] border-b border-[var(--border-hairline)] overflow-hidden pt-8 pb-16 sm:py-20 lg:py-24">
      {/* Background Architectural Subtle Line Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(circle_at_top_right,var(--accent)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      <Container size="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Editorial Text Column: 6 cols */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 z-10">
            <div className="space-y-3">
              <Eyebrow>
                Direct Japanese Importer &bull; Kaduruwela Main Showroom
              </Eyebrow>
              <Heading level={1} className="max-w-xl">
                Rare Quality. Direct Japanese Provenance.
              </Heading>
            </div>

            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] leading-relaxed max-w-lg">
              Individually inspected and secured from Tokyo auctions with verified
              Japanese export certificates. Unregistered high-grade vehicles for
              discerning motorists across Sri Lanka.
            </p>

            {/* Exactly One Primary CTA + One Text Link */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
              <Button variant="solid" size="lg" href="/vehicles">
                Explore Showroom Stock
              </Button>
              <Button
                variant="text-link"
                href={waInquiryUrl}
                isExternal
              >
                Direct WhatsApp Inquiry &rarr;
              </Button>
            </div>

            {/* Micro-specs of the Featured Spotlight Vehicle */}
            <div className="pt-6 border-t border-[var(--border-hairline)] grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <Numeral
                  value="USS / TAA"
                  label="Auction Sourcing"
                  size="sm"
                />
              </div>
              <div>
                <Numeral
                  value="100%"
                  label="Certified Genuine Mileage"
                  size="sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Numeral
                  value="No. 37/1"
                  label="Kaduruwela, Polonnaruwa"
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Right Visual Column: 6 cols — LCP Hero Image */}
          <div className="lg:col-span-6 z-10">
            <div className="relative group">
              <Link
                href={`/vehicles/${featuredVehicle.slug}`}
                className="block relative overflow-hidden rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] aspect-[16/10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                {/* 
                  CRITICAL LCP IMAGE: Explicit priority={true}, explicit sizing, AVIF/WebP ready.
                  This is the single prioritized image on the entire route.
                */}
                <Image
                  src={heroImage}
                  alt={`${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model} Showroom Spotlight`}
                  fill
                  priority={true}
                  fetchPriority="high"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
                  quality={90}
                  className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />

                {/* Subtle dark gradient overlay to ensure contrast against text & borders */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/60 via-transparent to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              </Link>

              {/* Float metadata banner right below the hero image */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center space-x-3">
                  <StatusLabel status={featuredVehicle.status} />
                  <span className="text-xs font-mono uppercase text-[var(--text-muted)] tracking-wider">
                    {featuredVehicle.year} {featuredVehicle.make} {featuredVehicle.model}
                  </span>
                </div>

                <div>
                  {formattedPrice ? (
                    <Numeral
                      value={formattedPrice}
                      prefix="LKR"
                      size="sm"
                      className="text-right"
                    />
                  ) : (
                    <span className="text-xs font-sans uppercase font-medium tracking-widest text-[var(--accent)]">
                      Call For Price
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

