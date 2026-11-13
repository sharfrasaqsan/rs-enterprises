import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
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
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0D" },
    { media: "(prefers-color-scheme: light)", color: "#F4F0E8" },
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
                var theme = storedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)]">
        <Header settings={settings} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer settings={settings} />
        <MobileActionBar settings={settings} />
      </body>
    </html>
  );
}
