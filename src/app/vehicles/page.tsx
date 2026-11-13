import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { getVehicles } from "@/lib/vehicles";
import { VehicleFilterParams, VehicleStatus, FuelType, TransmissionType } from "@/types/vehicle";
import { VehicleFilterBar } from "@/components/vehicles/VehicleFilterBar";
import { VehicleEntry } from "@/components/vehicles/VehicleEntry";
import { FeaturedVehicleEntry } from "@/components/vehicles/FeaturedVehicleEntry";
import { EmptyState } from "@/components/vehicles/EmptyState";
import { Pagination } from "@/components/vehicles/Pagination";
import { LazyCompareTray } from "@/components/vehicles/LazyCompareTray";

export const metadata: Metadata = {
  title: "Japanese Vehicle Showroom & In-Transit Inventory",
  description:
    "Curated collection of unregistered auction-grade Japanese vehicles in Sri Lanka. Toyota Land Cruiser, Prado, Harrier, Honda Vezel, Aqua, Axio at Kaduruwela main showroom.",
  alternates: {
    canonical: "/vehicles",
  },
  openGraph: {
    title: "Japanese Vehicle Inventory | RS Enterprises Company Pvt Ltd",
    description:
      "Explore verified auction-grade Japanese vehicles with full export certificates and inspection sheets.",
    url: "https://rsenterprises.lk/vehicles",
  },
};

function VehiclesLoadingFallback() {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="w-8 h-8 mx-auto border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-sans uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Retrieving Showroom Inventory...
      </p>
    </div>
  );
}

async function VehiclesListContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  // Extract query filters safely
  const filters: VehicleFilterParams = {
    make: typeof resolvedSearchParams.make === "string" ? resolvedSearchParams.make : undefined,
    model: typeof resolvedSearchParams.model === "string" ? resolvedSearchParams.model : undefined,
    status:
      typeof resolvedSearchParams.status === "string" &&
      ["available", "incoming", "reserved", "sold", "all"].includes(resolvedSearchParams.status)
        ? (resolvedSearchParams.status as VehicleStatus | "all")
        : undefined,
    minYear:
      typeof resolvedSearchParams.minYear === "string" && !isNaN(Number(resolvedSearchParams.minYear))
        ? Number(resolvedSearchParams.minYear)
        : undefined,
    maxYear:
      typeof resolvedSearchParams.maxYear === "string" && !isNaN(Number(resolvedSearchParams.maxYear))
        ? Number(resolvedSearchParams.maxYear)
        : undefined,
    minPrice:
      typeof resolvedSearchParams.minPrice === "string" && !isNaN(Number(resolvedSearchParams.minPrice))
        ? Number(resolvedSearchParams.minPrice)
        : undefined,
    maxPrice:
      typeof resolvedSearchParams.maxPrice === "string" && !isNaN(Number(resolvedSearchParams.maxPrice))
        ? Number(resolvedSearchParams.maxPrice)
        : undefined,
    fuel:
      typeof resolvedSearchParams.fuel === "string" &&
      ["petrol", "diesel", "hybrid", "electric", "all"].includes(resolvedSearchParams.fuel)
        ? (resolvedSearchParams.fuel as FuelType | "all")
        : undefined,
    transmission:
      typeof resolvedSearchParams.transmission === "string" &&
      ["automatic", "manual", "cvt", "all"].includes(resolvedSearchParams.transmission)
        ? (resolvedSearchParams.transmission as TransmissionType | "all")
        : undefined,
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined,
    sort:
      typeof resolvedSearchParams.sort === "string" &&
      ["price_asc", "price_desc", "year_desc", "year_asc", "mileage_asc", "recent"].includes(
        resolvedSearchParams.sort
      )
        ? (resolvedSearchParams.sort as
            | "price_asc"
            | "price_desc"
            | "year_desc"
            | "year_asc"
            | "mileage_asc"
            | "recent")
        : "recent",
    page:
      typeof resolvedSearchParams.page === "string" && !isNaN(Number(resolvedSearchParams.page))
        ? Math.max(1, Number(resolvedSearchParams.page))
        : 1,
    limit: 8,
  };

  const {
    vehicles,
    total,
    page,
    totalPages,
    hasNext,
    hasPrev,
    availableMakes,
  } = await getVehicles(filters);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Interactive URL Search Params Filter Bar */}
      <VehicleFilterBar
        availableMakes={availableMakes}
        totalResults={total}
      />

      {/* Vehicle Inventory List */}
      {vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-0">
          {vehicles.map((vehicle, idx) => {
            // Full-width featured entry for visual rhythm (e.g. index 0 on unfiltered page 1)
            if (idx === 0 && !filters.make && !filters.search && page === 1) {
              return (
                <FeaturedVehicleEntry
                  key={vehicle.id}
                  vehicle={vehicle}
                />
              );
            }

            return (
              <VehicleEntry
                key={vehicle.id}
                vehicle={vehicle}
              />
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        searchParams={resolvedSearchParams}
      />
    </div>
  );
}

export default function VehiclesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 sm:py-16 lg:py-20">
      <Container size="wide">
        <div className="space-y-8 sm:space-y-12">
          {/* Static Editorial Page Header Shell (Prerendered instantly) */}
          <div className="space-y-3 pb-8 border-b border-[var(--border-hairline)]">
            <Eyebrow>Direct Japanese Importer &bull; Kaduruwela &bull; Trincomalee</Eyebrow>
            <Heading level={1}>
              Curated Japanese Automotive Inventory
            </Heading>
            <p className="text-base sm:text-lg font-light text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Every vehicle is personally evaluated and secured from USS, TAA, and CAA
              Tokyo auctions with certified mileage and authentic auction inspection sheets.
            </p>
          </div>

          {/* Suspense Boundary for Runtime URL Search Params Streaming */}
          <Suspense fallback={<VehiclesLoadingFallback />}>
            <VehiclesListContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </Container>

      {/* Lazy-Loaded Vehicle Comparison Bottom Tray */}
      <LazyCompareTray />
    </div>
  );
}
