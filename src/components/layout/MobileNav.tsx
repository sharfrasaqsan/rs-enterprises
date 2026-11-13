"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompanySettings } from "@/types/settings";

export function MobileNav({ settings }: { settings: CompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  const navLinks = [
    { href: "/vehicles", label: "Showroom Stock" },
    { href: "/incoming", label: "In-Transit Pipeline" },
    { href: "/compare", label: "Vehicle Comparison" },
    { href: "/services", label: "Direct Japan Import" },
    { href: "/spare-parts", label: "Genuine Spare Parts" },
    { href: "/about", label: "Company Heritage" },
    { href: "/contact", label: "Showrooms & Contact" },
    { href: "/styleguide", label: "Design Styleguide" },
  ];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Toggle navigation drawer"
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <svg
            className="w-5 h-5 stroke-current"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 stroke-current"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-50 bg-[var(--bg-overlay)] backdrop-blur-lg flex flex-col justify-between p-6 overflow-y-auto border-t border-[var(--border-hairline)] animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-2 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex items-center min-h-[44px] px-3 py-2 text-base font-serif text-[var(--text-primary)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)] rounded-[2px] transition-luxury"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-[var(--border-hairline)] space-y-3">
            <WhatsAppButton
              number={settings.mainBranch.whatsapp}
              label="WhatsApp Showroom Desk"
              className="w-full text-center"
            />
            <PhoneLink
              number={settings.mainBranch.phone}
              displayNumber={settings.mainBranch.phone}
              label="Call Kaduruwela Showroom"
              variant="outline"
              className="w-full text-center"
            />
            <div className="text-center pt-2">
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {settings.mainBranch.hours}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

