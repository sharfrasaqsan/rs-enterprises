"use client";

import React, { useState } from "react";

interface MapFacadeProps {
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  directionsUrl?: string;
}

export function MapFacade({
  locationName,
  address,
  lat,
  lng,
  directionsUrl,
}: MapFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Fallback directions link if directionsUrl not provided
  const targetDirections =
    directionsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;

  return (
    <div className="w-full relative bg-[var(--bg-base)] border border-[var(--border-hairline)] overflow-hidden rounded-[2px]">
      {isLoaded ? (
        <div className="w-full h-80 sm:h-96 relative">
          <iframe
            src={embedUrl}
            title={`Map location for ${locationName}`}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full h-80 sm:h-96 flex flex-col justify-between p-6 sm:p-8 bg-[var(--bg-surface)] relative group">
          {/* Subtle architectural map pattern background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(var(--border-subtle) 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
            aria-hidden="true"
          />

          {/* Top metadata */}
          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
              Geographic Coordinates &bull; {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)]">
              {locationName}
            </h3>
            <p className="text-xs font-light text-[var(--text-secondary)]">
              {address}
            </p>
          </div>

          {/* Center Callout / Pin */}
          <div className="relative z-10 py-4 flex items-center justify-center">
            <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[var(--accent)] animate-ping" />
              <span className="text-xs font-sans tracking-wide text-[var(--text-primary)]">
                Kaduruwela Showroom Floor
              </span>
            </div>
          </div>

          {/* Bottom Actions: Click to load interactive map or open in external maps */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.18em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              Load Interactive Map
            </button>

            <a
              href={targetDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center text-xs font-sans uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

