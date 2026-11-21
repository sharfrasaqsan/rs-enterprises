"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side error for observability
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[var(--bg-base)]">
      <div className="max-w-xl w-full text-center space-y-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 sm:p-12 rounded-[2px] shadow-2xl relative overflow-hidden">
        <div className="space-y-3">
          <Eyebrow>SYSTEM NOTICE // APPLICATION RECOVERY</Eyebrow>
          <Heading level={1} className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-normal">
            Unexpected System Exception
          </Heading>
          <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-md mx-auto">
            A temporary connection or rendering interruption occurred while loading this section. Our dealership system has recorded the event.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
              Reference Code: {error.digest}
            </p>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium bg-[var(--accent)] text-stone-900 hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer"
          >
            Retry Section
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px]"
          >
            Return to Home
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto min-h-[44px] px-6 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em] font-medium border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[2px]"
          >
            Contact Staff
          </Link>
        </div>

        {/* Direct Dealership Support */}
        <div className="pt-6 border-t border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-muted)]">
          Need immediate support? Contact Kaduruwela Showroom:{" "}
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
