"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AdminNavItem {
  href: string;
  label: string;
  icon: "today" | "leads" | "vehicles" | "incoming" | "settings";
  ownerOnly?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Today", icon: "today" },
  { href: "/admin/leads", label: "Leads", icon: "leads" },
  { href: "/admin/vehicles", label: "Vehicles", icon: "vehicles" },
  { href: "/admin/incoming", label: "Incoming", icon: "incoming" },
  { href: "/admin/settings", label: "Settings", icon: "settings", ownerOnly: true },
];

function NavIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "today":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "leads":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "vehicles":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M5 17h14m-12 0a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM5 17l1.5-6h11L19 17M6.5 11l2-5h7l2 5" />
        </svg>
      );
    case "incoming":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M2 20a16 16 0 0020 0M4 16l2-8h12l2 8M9 8V4h6v4" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Login page gets a clean standalone card layout
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[var(--bg-base)]">{children}</div>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent animate-spin rounded-full" />
          <span className="text-xs uppercase tracking-widest font-mono">
            Loading Showroom System...
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-6">
        <div className="max-w-md w-full p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] block">
            Staff Portal Protected
          </span>
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">
            Please Sign In to Access Showroom CRM
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            This area is restricted to RS Enterprises sales staff and company directors.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="w-full h-12 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-widest bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter navigation items: Settings strictly visible to owners only (5 items max)
  const isOwner = user.role === "owner";
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner);

  const isItemActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col lg:flex-row">
      {/* Mobile Top App Bar (Visible on mobile & tablet) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] px-4 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-2 min-h-[44px]">
          <span className="font-serif text-lg font-normal tracking-wide text-[var(--text-primary)]">
            RS ENTERPRISES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--accent)] uppercase">
            CRM
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
            {user.role}
          </span>
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors"
            aria-label="Sign out"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Fixed 64, Exactly at most 5 items: Today, Leads, Vehicles, Incoming, Settings) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-hairline)] p-6 min-h-screen">
        <div className="space-y-8">
          {/* Showroom Brand */}
          <Link href="/admin" className="block focus:outline-none">
            <span className="font-serif text-xl font-normal tracking-[0.05em] text-[var(--text-primary)] block">
              RS ENTERPRISES
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Staff CRM
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] uppercase">
                {user.role}
              </span>
            </div>
          </Link>

          {/* Navigation Items (Max 5 items) */}
          <nav className="space-y-1.5" aria-label="Desktop Admin Navigation">
            {visibleNavItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-h-[44px] px-3.5 flex items-center gap-3 text-xs font-sans uppercase font-medium tracking-[0.14em] rounded-[2px] transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                  }`}
                >
                  <NavIcon name={item.icon} className="w-4 h-4 shrink-0 stroke-current" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: User identity, Theme toggle & Sign out */}
        <div className="space-y-4 pt-6 border-t border-[var(--border-hairline)]">
          <div className="space-y-0.5">
            <p className="text-xs font-serif text-[var(--text-primary)] truncate">
              {user.displayName}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
              {user.email}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className="text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors min-h-[44px] inline-flex items-center"
            >
              Live Website &rarr;
            </Link>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={signOut}
            className="w-full min-h-[44px] px-3 flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.16em] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-900 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area (pb-24 lg:pb-12 ensures mobile bottom tab bar never covers content) */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (Fixed bottom navigation for mobile & tablet, >= 44px tap targets) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] h-16 px-1 flex items-stretch justify-around backdrop-blur-md"
        aria-label="Mobile Admin Navigation"
      >
        {visibleNavItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center relative py-1 text-center transition-colors ${
                active
                  ? "text-[var(--accent)] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {active && (
                <span className="absolute top-0 inset-x-4 h-[2px] bg-[var(--accent)]" />
              )}
              <div className="w-5 h-5 flex items-center justify-center">
                <NavIcon name={item.icon} className="w-4 h-4 stroke-current" />
              </div>
              <span className="text-[9px] font-sans uppercase tracking-wider mt-1 truncate max-w-[56px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
