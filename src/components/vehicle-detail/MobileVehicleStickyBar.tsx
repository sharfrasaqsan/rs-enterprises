"use client";

import React from "react";
import { Vehicle } from "@/types/vehicle";
import { Numeral } from "@/components/ui/Numeral";

export function MobileVehicleStickyBar({
  vehicle,
  whatsappNumber,
  phoneNumber,
}: {
  vehicle: Vehicle;
  whatsappNumber: string;
  phoneNumber: string;
}) {
  const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
  const currentUrl = `https://rsenterprises.lk/vehicles/${vehicle.slug}`;
  const waText = encodeURIComponent(
    `Hello RS Enterprises, I am inquiring regarding the ${vehicle.year} ${vehicle.make} ${vehicle.model} listed at ${currentUrl}. Could you please share the inspection sheet and latest availability?`
  );

  return (
    <div
      aria-label="Mobile Vehicle Quick Contact"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-overlay)] backdrop-blur-md border-t border-[var(--border-subtle)] px-4 py-2.5 shadow-none transition-luxury"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Price Numeral or Inquire */}
        <div className="flex flex-col">
          {vehicle.price ? (
            <Numeral
              value={vehicle.price.toLocaleString("en-US")}
              prefix="LKR"
              size="sm"
            />
          ) : (
            <span className="text-xs font-sans uppercase font-medium tracking-wider text-[var(--accent)]">
              Call For Price
            </span>
          )}
          <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">
            {vehicle.status.toUpperCase()}
          </span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-luxury"
            aria-label="Call Showroom Hotline"
          >
            <svg
              className="w-4 h-4 stroke-current shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.6"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          <a
            href={`https://wa.me/${cleanWa}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury"
            aria-label="WhatsApp Showroom"
          >
            <svg
              className="w-4 h-4 mr-1.5 stroke-current shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.6"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

