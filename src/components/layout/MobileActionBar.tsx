import React from "react";
import { CompanySettings } from "@/types/settings";

export function MobileActionBar({ settings }: { settings: CompanySettings }) {
  const cleanPhone = settings.mainBranch.phone.replace(/[^0-9+]/g, "");
  const cleanWa = settings.mainBranch.whatsapp.replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(
    "Hello RS Enterprises, I am inquiring regarding your imported Japanese vehicles and showroom stock."
  );

  return (
    <aside
      aria-label="Quick Contact Actions"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-overlay)] backdrop-blur-md border-t border-[var(--border-subtle)] px-4 py-2.5 shadow-none transition-luxury"
    >
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {/* 1-Tap Telephone Call */}
        <a
          href={`tel:${cleanPhone}`}
          className="inline-flex items-center justify-center min-h-[48px] px-4 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label={`Call Kaduruwela Showroom on ${settings.mainBranch.phone}`}
        >
          <svg
            className="w-4 h-4 mr-2 stroke-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Call Desk</span>
        </a>

        {/* 1-Tap WhatsApp Inquiry */}
        <a
          href={`https://wa.me/${cleanWa}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center min-h-[48px] px-4 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label="Direct WhatsApp Inquiry"
        >
          <svg
            className="w-4 h-4 mr-2 stroke-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </aside>
  );
}

