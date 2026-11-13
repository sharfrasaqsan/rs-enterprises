"use client";

import React, { useState } from "react";
import Image from "next/image";

export function VehicleGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages =
    images && images.length > 0
      ? images
      : ["/images/vehicles/sample-prado.svg", "/images/vehicles/sample-vezel.svg"];

  return (
    <div className="w-full space-y-4">
      {/* 
        Desktop & Tablet: Large Focal Image with Active Thumbnail Row 
      */}
      <div className="hidden sm:block space-y-4">
        {/* Main Stage Image */}
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] group">
          <Image
            src={displayImages[selectedIndex] || displayImages[0]}
            alt={`${title} - Showcase View ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            loading={selectedIndex === 0 ? undefined : "lazy"}
            sizes="(max-width: 1024px) 100vw, 65vw"
            quality={90}
            className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
          />
          {/* Subtle bottom gradient for contrast */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/40 via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Index Counter Badge */}
          <div className="absolute bottom-4 right-4 z-10 px-2.5 py-1 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] rounded-[1px]">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        </div>

        {/* Thumbnail Selector Strip */}
        {displayImages.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-current={selectedIndex === idx ? "true" : undefined}
                className={`relative w-24 h-16 shrink-0 overflow-hidden rounded-[2px] border transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  selectedIndex === idx
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--border-hairline)] opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} thumbnail ${idx + 1}`}
                  fill
                  loading="lazy"
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 
        Mobile: Full-Bleed Horizontal Swipe Container with Snap 
      */}
      <div className="sm:hidden -mx-4">
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none space-x-0 w-full">
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                className="w-full shrink-0 snap-center relative aspect-[16/10] bg-[var(--bg-surface)]"
              >
                <Image
                  src={img}
                  alt={`${title} - View ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  loading={idx === 0 ? undefined : "lazy"}
                  sizes="100vw"
                  quality={85}
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/50 via-transparent to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* Mobile Dot/Counter Pill */}
          <div className="absolute bottom-3 right-4 z-10 px-2 py-0.5 bg-[var(--bg-overlay)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-primary)] rounded-[1px]">
            {displayImages.length} Photos &bull; Swipe &rarr;
          </div>
        </div>
      </div>
    </div>
  );
}

