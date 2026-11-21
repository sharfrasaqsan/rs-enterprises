import React from "react";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[var(--bg-base)]">
      <div className="max-w-xl w-full text-center space-y-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 sm:p-12 rounded-[2px] shadow-2xl relative overflow-hidden">
        {/* Subtle Luxury Corner Accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--accent)]/10 to-transparent pointer-events-none" />

        <div className="space-y-3">
          <Eyebrow>404 // ALLOCATION NOT FOUND</Eyebrow>
          <Heading level={1} className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-normal">
            Page or Vehicle Not Located
          </Heading>
          <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-md mx-auto">
            The vehicle listing or page you are attempting to view may have been acquired, archived, or is currently being updated in our showroom registry.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/vehicles"
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium bg-[var(--accent)] text-stone-900 hover:bg-[var(--accent-hover)] transition-colors rounded-[2px]"
          >
            Explore Showroom
          </Link>
          <Link
            href="/incoming"
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px]"
          >
            In-Transit Shipments
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[2px]"
          >
            Contact Staff
          </Link>
        </div>

        {/* Dealership Hotline Footer */}
        <div className="pt-6 border-t border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-muted)]">
          Need immediate concierge assistance? Call Kaduruwela Showroom:{" "}
          <a
            href="tel:+94771234567"
            className="text-[var(--accent)] hover:underline ml-1"
          >
            +94 77 123 4567
          </a>
        </div>
      </div>
    </main>
  );
}
