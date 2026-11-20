"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CompareCounter } from "@/components/ui/CompareCounter";
import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/ui/Logo";
import { CompanySettings } from "@/types/settings";

export function Header({ settings }: { settings: CompanySettings }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/vehicles", label: "Showroom" },
    { href: "/incoming", label: "In-Transit" },
    { href: "/services", label: "Direct Import" },
    { href: "/spare-parts", label: "Spare Parts" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="site-header sticky top-0 z-50 w-full bg-[var(--bg-overlay)] backdrop-blur-md border-b border-[var(--border-hairline)] transition-luxury">
      {/* Site-Wide Announcement Banner (Configurable in Admin Settings) */}
      {settings.announcement?.enabled && settings.announcement.text && (
        <div className="w-full bg-[var(--accent)] text-white text-[11px] sm:text-xs font-sans font-medium py-2 px-4 text-center tracking-wide transition-colors">
          <Container size="wide">
            {settings.announcement.link ? (
              <Link
                href={settings.announcement.link}
                className="hover:underline inline-flex items-center gap-1.5 justify-center min-h-[32px]"
              >
                <span>{settings.announcement.text}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            ) : (
              <span>{settings.announcement.text}</span>
            )}
          </Container>
        </div>
      )}

      <Container size="wide">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          {/* Brand Logo & Editorial Heritage Tagline */}
          <Link
            href="/"
            className="flex items-center min-h-[44px] gap-2.5 sm:gap-3 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] shrink-0 select-none"
            aria-label="RS Enterprises Home"
          >
            <Logo className="h-8 sm:h-9 xl:h-10 w-auto shrink-0" />
            <div className="flex flex-col justify-center">
              <span className="font-serif text-base sm:text-lg font-medium tracking-[0.08em] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight whitespace-nowrap">
                RS ENTERPRISES
              </span>
              <span className="text-[8px] sm:text-[9px] font-sans font-medium uppercase tracking-[0.24em] text-[var(--accent)] whitespace-nowrap">
                Kaduruwela &bull; Polonnaruwa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Responsive gap & tracking eliminates 1024px-1280px overflow */}
          <nav
            className="hidden lg:flex items-center lg:space-x-3.5 xl:space-x-6 2xl:space-x-8 shrink-0"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-[44px] inline-flex items-center text-[11px] font-sans uppercase font-medium whitespace-nowrap lg:tracking-[0.14em] xl:tracking-[0.20em] 2xl:tracking-[0.22em] transition-colors relative py-1 link-underline ${
                    active
                      ? "text-[var(--text-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-1 inset-x-0 h-[2px] bg-[var(--accent)] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Utility Tools: Compare Counter, Theme Toggle & Mobile Nav */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <CompareCounter />
            <ThemeToggle />
            <MobileNav settings={settings} />
          </div>
        </div>
      </Container>
    </header>
  );
}
