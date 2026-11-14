import React from "react";
import { Container } from "@/components/ui/Container";

export interface SearchStripProps {
  availableMakes?: string[];
  className?: string;
}

export function SearchStrip({
  availableMakes = ["Toyota", "Honda", "Nissan", "Suzuki", "Mitsubishi"],
  className = "",
}: SearchStripProps) {
  return (
    <div className={`relative z-20 -mt-10 sm:-mt-14 px-4 ${className}`}>
      <Container size="wide">
        <form
          action="/vehicles"
          method="GET"
          className="bg-[var(--bg-elevated)]/95 border border-[var(--border-subtle)] rounded-[2px] p-5 sm:p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            {/* 1. Make Select */}
            <div className="space-y-2">
              <label
                htmlFor="search-make"
                className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]"
              >
                01 // Manufacturer
              </label>
              <div className="relative">
                <select
                  id="search-make"
                  name="make"
                  defaultValue="all"
                  className="w-full min-h-[50px] px-4 py-3 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none transition-luxury appearance-none cursor-pointer hover:border-[var(--border-subtle)]"
                >
                  <option value="all">All Japanese Makes</option>
                  {availableMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Budget Range */}
            <div className="space-y-2">
              <label
                htmlFor="search-price"
                className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]"
              >
                02 // Budget Range
              </label>
              <div className="relative">
                <select
                  id="search-price"
                  name="maxPrice"
                  defaultValue=""
                  className="w-full min-h-[50px] px-4 py-3 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none transition-luxury appearance-none cursor-pointer hover:border-[var(--border-subtle)]"
                >
                  <option value="">Any Budget</option>
                  <option value="10000000">Under LKR 10 Million</option>
                  <option value="20000000">Under LKR 20 Million</option>
                  <option value="35000000">Under LKR 35 Million</option>
                  <option value="50000000">Under LKR 50 Million</option>
                  <option value="100000000">Up to LKR 100 Million</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. Year Select */}
            <div className="space-y-2">
              <label
                htmlFor="search-year"
                className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]"
              >
                03 // Minimum Year
              </label>
              <div className="relative">
                <select
                  id="search-year"
                  name="minYear"
                  defaultValue=""
                  className="w-full min-h-[50px] px-4 py-3 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans uppercase tracking-wider focus:border-[var(--accent)] focus:outline-none transition-luxury appearance-none cursor-pointer hover:border-[var(--border-subtle)]"
                >
                  <option value="">All Production Years</option>
                  <option value="2024">2024 &amp; Newer</option>
                  <option value="2023">2023 &amp; Newer</option>
                  <option value="2022">2022 &amp; Newer</option>
                  <option value="2021">2021 &amp; Newer</option>
                  <option value="2020">2020 &amp; Newer</option>
                  <option value="2018">2018 &amp; Newer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. Action Button */}
            <div>
              <button
                type="submit"
                className="w-full min-h-[50px] px-6 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-sans text-xs uppercase font-semibold tracking-[0.22em] transition-luxury flex items-center justify-center cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:translate-y-[1px] shadow-lg"
              >
                <svg
                  className="w-4 h-4 mr-2 stroke-current shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <span>Filter Inventory</span>
              </button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
