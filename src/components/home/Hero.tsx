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
  const rawImage = featuredVehicle.images[0] || "/images/vehicles/land-cruiser-300.jpg";
  const heroImage =
    rawImage.includes("sample-prado.svg") || rawImage.includes("sample-vezel.svg")
      ? "/images/vehicles/land-cruiser-300.jpg"
      : rawImage;

  const formattedPrice = featuredVehicle.price
    ? featuredVehicle.price.toLocaleString("en-US")
    : null;

  const cleanWa = settings.mainBranch.whatsapp.replace(/[^0-9]/g, "");
  const waInquiryUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Hello RS Enterprises, I am inquiring regarding the featured ${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model} on your showroom homepage.`
  )}`;

  return (
    <section className="relative w-full bg-[var(--bg-base)] border-b border-[var(--border-hairline)] overflow-hidden pt-8 pb-20 sm:pt-12 sm:pb-28">
      {/* Background Architectural Luxury Studio Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] dark:opacity-[0.22] bg-[radial-gradient(ellipse_at_50%_30%,var(--accent)_0%,rgba(212,175,55,0.03)_50%,transparent_75%)]"
        aria-hidden="true"
      />

      <Container size="wide">
        <div className="space-y-10 sm:space-y-14">
          {/* Top Editorial Row: Brand Header & Japanese Auction Provenance */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <Eyebrow>Direct Japanese Importer &bull; Kaduruwela Main Showroom</Eyebrow>
              </div>
              <Heading level={1} className="tracking-[-0.02em]">
                Rare Quality. Direct Japanese Provenance.
              </Heading>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:text-right">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--accent)] block">
                  Tokyo Auction Sourcing
                </span>
                <span className="font-serif text-lg sm:text-xl font-light text-[var(--text-primary)] block">
                  USS &bull; TAA &bull; CAA Tokyo
                </span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-[var(--border-hairline)]" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--accent)] block">
                  Certified Integrity
                </span>
                <span className="font-serif text-lg sm:text-xl font-light text-[var(--text-primary)] block">
                  100% Genuine Odometer
                </span>
              </div>
            </div>
          </div>

          {/* Centerpiece Showcase: Monumental Automotive Presentation */}
          <div className="relative group">
            <Link
              href={`/vehicles/${featuredVehicle.slug}`}
              className="block relative overflow-hidden rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] aspect-[16/9] sm:aspect-[21/9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] shadow-2xl transition-all duration-700"
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
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1400px"
                quality={92}
                className="object-cover object-center transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
              />

              {/* Floating Glassmorphic Badges */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-3.5 py-1.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--accent)] text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--text-primary)] rounded-[1px] shadow-lg flex items-center gap-1.5">
                  <span className="text-[var(--accent)]">&bull;</span>
                  {featuredVehicle.grade || "Japan Auction Grade 6 / 5A"}
                </span>
                <span className="hidden sm:inline-block px-3 py-1.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] rounded-[1px]">
                  Unregistered Import
                </span>
              </div>

              {/* Top-Right Status & Stock Number */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
                <span className="px-3 py-1.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] rounded-[1px] shadow-sm">
                  Available in Showroom
                </span>
              </div>

              {/* Subtle cinematic gradient overlay for depth and focus */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-black/25 pointer-events-none opacity-80"
                aria-hidden="true"
              />

              {/* Bottom In-Image Title Bar */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white pointer-events-none">
                <div className="space-y-1">
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[var(--accent)] block">
                    Flagship Showroom Acquisition
                  </span>
                  <span className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white drop-shadow-md">
                    {featuredVehicle.year} {featuredVehicle.make} {featuredVehicle.model}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-white/70 block">
                    Showroom Asking Price
                  </span>
                  {formattedPrice ? (
                    <span className="font-serif text-xl sm:text-3xl text-[var(--accent)] drop-shadow-md">
                      LKR {formattedPrice}
                    </span>
                  ) : (
                    <span className="font-sans text-sm uppercase tracking-widest text-[var(--accent)]">
                      Call For Price
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Precision Horology Monograph Strip (Below Image) */}
            <div className="mt-4 p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-center">
              <div className="space-y-1 border-r-0 sm:border-r border-[var(--border-hairline)] pr-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] block">
                  Displacement & Engine
                </span>
                <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] block">
                  {featuredVehicle.engineCC.toLocaleString("en-US")} CC &bull; {featuredVehicle.fuel}
                </span>
              </div>

              <div className="space-y-1 border-r-0 lg:border-r border-[var(--border-hairline)] pr-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] block">
                  Certified Odometer
                </span>
                <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] block">
                  {featuredVehicle.mileage.toLocaleString("en-US")} KM Genuine
                </span>
              </div>

              <div className="space-y-1 border-r-0 sm:border-r border-[var(--border-hairline)] pr-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] block">
                  Transmission
                </span>
                <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] block capitalize">
                  {featuredVehicle.transmission}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button variant="diamond" size="md" href="/vehicles" className="flex-1 justify-center">
                  Explore Showroom
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  href={waInquiryUrl}
                  isExternal
                  className="flex-1 justify-center"
                >
                  WhatsApp &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
