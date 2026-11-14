"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { ScrollRevealObserver } from "@/components/layout/ScrollRevealObserver";
import { CompanySettings } from "@/types/settings";

export function PublicShell({
  settings,
  children,
}: {
  settings: CompanySettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Admin site is a dedicated, protected CRM workspace:
    // Exclude public site header, customer footer, customer contact action bar, and scroll observer.
    return <>{children}</>;
  }

  return (
    <>
      <Header settings={settings} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer settings={settings} />
      <MobileActionBar settings={settings} />
      <ScrollRevealObserver />
    </>
  );
}

