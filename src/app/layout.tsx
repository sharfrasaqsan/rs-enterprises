import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PublicShell } from "@/components/layout/PublicShell";
import { getCompanySettings } from "@/lib/settings";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Times New Roman", "Garamond", "serif"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rsenterprises.lk"),
  title: {
    default: "RS Enterprises Company Pvt Ltd | Japanese Vehicle & Spare Parts Importer",
    template: "%s | RS Enterprises Company Pvt Ltd",
  },
  description:
    "Direct importer and premier dealer of high-grade Japanese vehicles and genuine spare parts. Kaduruwela, Polonnaruwa and Trincomalee, Sri Lanka.",
  keywords: [
    "Japanese vehicle importer Sri Lanka",
    "direct auction import Sri Lanka",
    "Japanese car dealer Polonnaruwa",
    "Kaduruwela vehicle sales",
    "Trincomalee car showroom",
    "genuine Japanese spare parts",
  ],
  authors: [{ name: "RS Enterprises Company Pvt Ltd" }],
  creator: "RS Enterprises Company Pvt Ltd",
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: "https://rsenterprises.lk",
    siteName: "RS Enterprises Company Pvt Ltd",
    title: "RS Enterprises Company Pvt Ltd | Japanese Vehicle Importer",
    description:
      "Direct importer and premier dealer of high-grade Japanese vehicles and genuine spare parts. Kaduruwela, Polonnaruwa, Sri Lanka.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RS Enterprises Company Pvt Ltd | Japanese Vehicle Importer",
    description:
      "Direct importer and premier dealer of high-grade Japanese vehicles and genuine spare parts. Kaduruwela, Polonnaruwa, Sri Lanka.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCompanySettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${plusJakarta.variable} font-sans`}
    >
      <head>
        {/*
          Blocking inline script to apply saved or preferred theme before first paint.
          Guarantees zero flash of unstyled theme and zero layout shift.
        */}
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var storedTheme = localStorage.getItem('rs_theme');
                var theme = storedTheme || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();`,
          }}
        />
        {/* No-JS fallback ensuring all scroll elements are immediately visible */}
        <noscript>
          <style>{`.reveal-on-scroll { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)]">
        <PublicShell settings={settings}>{children}</PublicShell>
      </body>
    </html>
  );
}
