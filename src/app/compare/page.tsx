import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getVehiclesBySlugs } from "@/lib/vehicles";
import { ComparisonView } from "@/components/compare/ComparisonView";
import { CompareEmptyState } from "@/components/compare/CompareEmptyState";
import { LazyCompareTray } from "@/components/vehicles/LazyCompareTray";

export const metadata: Metadata = {
  title: "Vehicle Specification Comparison | RS Enterprises",
  description:
    "Compare up to 3 imported Japanese vehicles side by side across auction grade, mileage, displacement, and showroom prices.",
  robots: {
    index: false,
    follow: true,
  },
};

function CompareLoadingFallback() {
  return (
    <div className="py-24 text-center space-y-4">
      <div className="w-8 h-8 mx-auto border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-sans uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Compiling Side-by-Side Comparison...
      </p>
    </div>
  );
}

async function CompareContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const rawV = typeof resolvedParams.v === "string" ? resolvedParams.v : "";

  const slugs = rawV
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3); // Max 3 vehicles

  const vehicles = await getVehiclesBySlugs(slugs);
  const shareUrl = `https://rsenterprises.lk/compare?v=${slugs.join(",")}`;

  if (vehicles.length < 2) {
    return (
      <CompareEmptyState singleVehicle={vehicles.length === 1 ? vehicles[0] : null} />
    );
  }

  return (
    <ComparisonView
      vehicles={vehicles}
      shareUrl={shareUrl}
    />
  );
}

export default function ComparePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 sm:py-16 pb-28">
      <Container size="wide">
        <div className="space-y-8 sm:space-y-12">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Showroom Inventory", href: "/vehicles" },
              { label: "Vehicle Comparison" },
            ]}
          />

          {/* Page Heading */}
          <div className="space-y-3 pb-6 border-b border-[var(--border-hairline)]">
            <Eyebrow>Direct Specification Matrix</Eyebrow>
            <Heading level={1}>
              Side-by-Side Vehicle Comparison
            </Heading>
            <p className="text-base font-light text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Compare auction inspection grades, certified mileage, powertrain specifications,
              and showroom pricing side by side.
            </p>
          </div>

          {/* Comparison Content streamed with Suspense */}
          <Suspense fallback={<CompareLoadingFallback />}>
            <CompareContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </Container>

      {/* Persistent Compare Tray */}
      <LazyCompareTray />
    </div>
  );
}

