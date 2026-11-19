"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompanySettings } from "@/types/settings";

const emptySubscribe = () => () => {};

export function MobileNav({ settings }: { settings: CompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(80);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Adjust state during render when route changes (standard React documentation pattern)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Hydration-safe client-mounted check without cascading effect renders
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Synchronize document scroll locking with external DOM system
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const headerEl = document.querySelector(".site-header");
        if (headerEl) {
          const rect = headerEl.getBoundingClientRect();
          setTopOffset(rect.bottom > 0 ? Math.round(rect.bottom) : 80);
        }
      }
      return next;
    });
  };

  const close = () => setIsOpen(false);

  const navLinks = [
    { href: "/vehicles", label: "Showroom Inventory" },
    { href: "/incoming", label: "In-Transit Pipeline" },
    { href: "/compare", label: "Vehicle Comparison" },
    { href: "/services", label: "Direct Japan Import" },
    { href: "/services#trade-in", label: "Trade-In Valuation" },
    { href: "/spare-parts", label: "Genuine Spare Parts" },
    { href: "/about", label: "Company Heritage" },
    { href: "/contact", label: "Showrooms & Contact" },
    { href: "/styleguide", label: "Design Styleguide" },
  ];

  const drawerContent = isOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col justify-between p-6 sm:p-8 overflow-y-auto border-t border-[var(--border-hairline)] shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: `${topOffset}px`,
        backgroundColor: "var(--bg-base)",
      }}
    >
      {/* Navigation Links */}
      <nav className="flex flex-col space-y-1 py-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`flex items-center justify-between min-h-[50px] px-4 py-3 rounded-[2px] border-b border-[var(--border-hairline)] text-base font-serif transition-luxury ${
                isActive
                  ? "text-[var(--accent)] font-medium bg-[var(--bg-surface)]"
                  : "text-[var(--text-primary)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              <span>{link.label}</span>
              <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Action Desk & Branch Hotlines */}
      <div className="pt-6 mt-6 border-t border-[var(--border-hairline)] space-y-3.5">
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
        <div className="text-center pt-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] block">
            {settings.mainBranch.name}
          </span>
          <span className="text-[11px] font-sans text-[var(--text-muted)] block">
            {settings.mainBranch.hours}
          </span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Toggle navigation drawer"
        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] p-2 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="sr-only">{isOpen ? "Close main menu" : "Open main menu"}</span>
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

      {/* Render drawer into document.body to escape header CSS containing block */}
      {isClient && drawerContent ? createPortal(drawerContent, document.body) : null}
    </div>
  );
}
