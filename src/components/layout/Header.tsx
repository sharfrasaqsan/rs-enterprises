import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CompareCounter } from "@/components/ui/CompareCounter";
import { MobileNav } from "@/components/layout/MobileNav";
import { CompanySettings } from "@/types/settings";

export function Header({ settings }: { settings: CompanySettings }) {
  const navItems = [
    { href: "/vehicles", label: "Showroom" },
    { href: "/incoming", label: "In-Transit" },
    { href: "/services", label: "Direct Import" },
    { href: "/spare-parts", label: "Spare Parts" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

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
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Editorial Heritage Tagline */}
          <Link
            href="/"
            className="flex flex-col justify-center min-h-[44px] group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            aria-label="RS Enterprises Home"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="font-serif text-xl sm:text-2xl font-normal tracking-[0.12em] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                RS ENTERPRISES
              </span>
            </div>
            <span className="text-[10px] font-sans font-medium uppercase tracking-[0.26em] text-[var(--accent)] ml-3.5 -mt-0.5">
              Kaduruwela &bull; Trincomalee
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-9" aria-label="Main Navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-[44px] inline-flex items-center text-[11px] font-sans uppercase font-medium tracking-[0.22em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative py-1 link-underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Utility Tools: Compare Counter, Theme Toggle & Mobile Nav */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CompareCounter />
            <ThemeToggle />
            <MobileNav settings={settings} />
          </div>
        </div>
      </Container>
    </header>
  );
}

