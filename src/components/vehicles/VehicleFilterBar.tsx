"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  VehicleStatus,
  FuelType,
  TransmissionType,
  BodyType,
  DealershipBranch,
  formatBodyType,
  formatBranch,
} from "@/types/vehicle";

export interface VehicleFilterBarProps {
  availableMakes: string[];
  totalResults: number;
}

export function VehicleFilterBar({
  availableMakes,
  totalResults,
}: VehicleFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Read current filters from URL
  const currentMake = searchParams.get("make") || "all";
  const currentModel = searchParams.get("model") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentBodyType = searchParams.get("bodyType") || "all";
  const currentBranch = searchParams.get("branch") || "all";
  const currentMinYear = searchParams.get("minYear") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentFuel = searchParams.get("fuel") || "all";
  const currentTransmission = searchParams.get("transmission") || "all";
  const currentSort = searchParams.get("sort") || "recent";

  // Helper to push updated search params
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
    setIsMobileOpen(false);
  };

  // Build list of active filter tags
  const activeTags: { key: string; label: string }[] = [];
  if (currentMake !== "all") activeTags.push({ key: "make", label: `Make: ${currentMake}` });
  if (currentModel) activeTags.push({ key: "model", label: `Model: ${currentModel}` });
  if (currentBodyType !== "all") activeTags.push({ key: "bodyType", label: `Body: ${formatBodyType(currentBodyType)}` });
  if (currentBranch !== "all") activeTags.push({ key: "branch", label: `Branch: ${currentBranch === "polonnaruwa" ? "Kaduruwela" : "Trincomalee"}` });
  if (currentStatus !== "all") activeTags.push({ key: "status", label: `Status: ${currentStatus.toUpperCase()}` });
  if (currentMinYear) activeTags.push({ key: "minYear", label: `Year: ${currentMinYear}+` });
  if (currentMaxPrice) {
    const priceM = (Number(currentMaxPrice) / 1000000).toFixed(0);
    activeTags.push({ key: "maxPrice", label: `Max: LKR ${priceM}M` });
  }
  if (currentFuel !== "all") activeTags.push({ key: "fuel", label: `Fuel: ${currentFuel}` });
  if (currentTransmission !== "all") activeTags.push({ key: "transmission", label: `Gearbox: ${currentTransmission}` });

  return (
    <div className="w-full space-y-4">
      {/* 
        Desktop Calm Filter Bar (2 Rows x 4 Columns)
      */}
      <div className="hidden lg:grid grid-cols-4 gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] items-center">
        {/* 1. Make */}
        <div>
          <label htmlFor="filter-make" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] mb-1">
            Manufacturer
          </label>
          <select
            id="filter-make"
            value={currentMake}
            onChange={(e) => updateParam("make", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Makes</option>
            {availableMakes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Body Type */}
        <div>
          <label htmlFor="filter-body-type" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] mb-1">
            Body Type
          </label>
          <select
            id="filter-body-type"
            value={currentBodyType}
            onChange={(e) => updateParam("bodyType", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Body Types</option>
            <option value="suv">SUV</option>
            <option value="sedan">Sedan</option>
            <option value="hatchback">Hatchback</option>
            <option value="mpv">MPV / Mini Van</option>
            <option value="crossover">Crossover</option>
            <option value="wagon">Station Wagon</option>
            <option value="van">Van</option>
            <option value="coupe">Coupe</option>
            <option value="pickup">Pickup Truck</option>
          </select>
        </div>

        {/* 3. Dealership Branch */}
        <div>
          <label htmlFor="filter-branch" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] mb-1">
            Showroom Location
          </label>
          <select
            id="filter-branch"
            value={currentBranch}
            onChange={(e) => updateParam("branch", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Showrooms</option>
            <option value="polonnaruwa">Kaduruwela Main Showroom</option>
            <option value="trincomalee">Trincomalee Branch</option>
          </select>
        </div>

        {/* 4. Showroom Status */}
        <div>
          <label htmlFor="filter-status" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] mb-1">
            Availability
          </label>
          <select
            id="filter-status"
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available in Showroom</option>
            <option value="incoming">In-Transit Pipeline</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold Units</option>
          </select>
        </div>

        {/* 5. Max Budget */}
        <div>
          <label htmlFor="filter-price" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Budget Bracket
          </label>
          <select
            id="filter-price"
            value={currentMaxPrice}
            onChange={(e) => updateParam("maxPrice", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="">Any Budget</option>
            <option value="10000000">Under 10M LKR</option>
            <option value="20000000">Under 20M LKR</option>
            <option value="35000000">Under 35M LKR</option>
            <option value="50000000">Under 50M LKR</option>
            <option value="90000000">Under 90M LKR</option>
          </select>
        </div>

        {/* 6. Min Year */}
        <div>
          <label htmlFor="filter-year" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Minimum Year
          </label>
          <select
            id="filter-year"
            value={currentMinYear}
            onChange={(e) => updateParam("minYear", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="">All Production Years</option>
            <option value="2024">2024 &amp; Newer</option>
            <option value="2023">2023 &amp; Newer</option>
            <option value="2022">2022 &amp; Newer</option>
            <option value="2021">2021 &amp; Newer</option>
            <option value="2020">2020 &amp; Newer</option>
          </select>
        </div>

        {/* 7. Fuel */}
        <div>
          <label htmlFor="filter-fuel" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Powertrain
          </label>
          <select
            id="filter-fuel"
            value={currentFuel}
            onChange={(e) => updateParam("fuel", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Fuel Types</option>
            <option value="hybrid">Hybrid / e:HEV</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        {/* 8. Sorting */}
        <div>
          <label htmlFor="filter-sort" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Sort By
          </label>
          <select
            id="filter-sort"
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none cursor-pointer"
          >
            <option value="recent">Latest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="year_desc">Year: Newest First</option>
            <option value="mileage_asc">Mileage: Lowest First</option>
          </select>
        </div>
      </div>

      {/* 
        Mobile Filter Trigger & Active Status Bar 
      */}
      <div className="flex lg:hidden items-center justify-between gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="inline-flex items-center min-h-[44px] px-4 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--accent)] transition-luxury cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <span>Filters &amp; Sort {activeTags.length > 0 && `(${activeTags.length})`}</span>
        </button>

        <span className="text-xs font-serif text-[var(--text-muted)]">
          {totalResults} {totalResults === 1 ? "Vehicle" : "Vehicles"}
        </span>
      </div>

      {/* 
        Active Filter Removable Text Tags 
      */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[var(--text-muted)] mr-2 hidden sm:inline-block">
          Active Filters:
        </span>

        {activeTags.length === 0 ? (
          <span className="text-xs text-[var(--text-muted)] font-light italic">
            Showing all showroom inventory ({totalResults} available)
          </span>
        ) : (
          <>
            {activeTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider space-x-1.5"
              >
                <span>{tag.label}</span>
                <button
                  type="button"
                  onClick={() => removeParam(tag.key)}
                  aria-label={`Remove filter ${tag.label}`}
                  className="text-[var(--text-muted)] hover:text-[var(--accent)] font-bold px-1 min-w-[20px] min-h-[20px] cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--accent)] hover:underline ml-2 min-h-[36px] inline-flex items-center cursor-pointer"
            >
              Reset All
            </button>
          </>
        )}
      </div>

      {/* 
        Mobile Slide-Over Panel 
      */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--bg-base)] h-full overflow-y-auto p-6 flex flex-col justify-between border-l border-[var(--border-hairline)] space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                <span className="font-serif text-lg text-[var(--text-primary)]">
                  Filter Showroom Stock
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  &times;
                </button>
              </div>

              {/* Mobile Inputs */}
              <div className="space-y-4 text-xs font-sans">
                {/* Make */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Make</span>
                  <select
                    value={currentMake}
                    onChange={(e) => updateParam("make", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="all">All Makes</option>
                    {availableMakes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Body Type */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Body Type</span>
                  <select
                    value={currentBodyType}
                    onChange={(e) => updateParam("bodyType", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="all">All Body Types</option>
                    <option value="suv">SUV</option>
                    <option value="sedan">Sedan</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="mpv">MPV / Mini Van</option>
                    <option value="crossover">Crossover</option>
                    <option value="wagon">Station Wagon</option>
                    <option value="van">Van</option>
                    <option value="coupe">Coupe</option>
                    <option value="pickup">Pickup Truck</option>
                  </select>
                </div>

                {/* Showroom Location */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Showroom Location</span>
                  <select
                    value={currentBranch}
                    onChange={(e) => updateParam("branch", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="all">All Showrooms</option>
                    <option value="polonnaruwa">Kaduruwela Main Showroom</option>
                    <option value="trincomalee">Trincomalee Branch</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Showroom Status</span>
                  <select
                    value={currentStatus}
                    onChange={(e) => updateParam("status", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="incoming">In-Transit</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Maximum Budget</span>
                  <select
                    value={currentMaxPrice}
                    onChange={(e) => updateParam("maxPrice", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="">Any Budget</option>
                    <option value="10000000">Under 10M LKR</option>
                    <option value="20000000">Under 20M LKR</option>
                    <option value="35000000">Under 35M LKR</option>
                    <option value="50000000">Under 50M LKR</option>
                  </select>
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Minimum Year</span>
                  <select
                    value={currentMinYear}
                    onChange={(e) => updateParam("minYear", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="">All Years</option>
                    <option value="2023">2023 &amp; Newer</option>
                    <option value="2022">2022 &amp; Newer</option>
                    <option value="2021">2021 &amp; Newer</option>
                  </select>
                </div>

                {/* Sorting */}
                <div className="space-y-1.5">
                  <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Sort Order</span>
                  <select
                    value={currentSort}
                    onChange={(e) => updateParam("sort", e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px]"
                  >
                    <option value="recent">Latest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="year_desc">Year: Newest First</option>
                    <option value="mileage_asc">Mileage: Lowest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-hairline)] space-y-3">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="w-full min-h-[48px] bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-sans uppercase font-medium tracking-[0.16em] rounded-[2px]"
              >
                View {totalResults} Results
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full min-h-[44px] text-xs font-sans uppercase font-medium tracking-[0.16em] text-[var(--text-muted)]"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

