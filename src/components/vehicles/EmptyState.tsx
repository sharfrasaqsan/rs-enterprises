"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SaveSearchButton } from "./SaveSearchButton";
import { generateSearchTitle } from "@/types/saved-search";

export function EmptyState() {
  const searchParams = useSearchParams();

  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || searchParams.get("search") || "";
  const maxPriceStr = searchParams.get("maxPrice") || "";
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;
  const bodyType = searchParams.get("bodyType") || "";

  const hasSpecificQuery = Boolean(make || model || maxPrice);
  const searchTitle = generateSearchTitle({
    make: make !== "all" ? make : undefined,
    model,
    maxPrice,
    bodyType: bodyType !== "all" ? bodyType : undefined,
  });

  return (
    <div className="py-16 sm:py-24 text-center border-t border-[var(--border-hairline)] space-y-6 max-w-xl mx-auto">
      <div className="space-y-3">
        <Eyebrow>No Showroom Matches</Eyebrow>
        <Heading level={3}>
          {hasSpecificQuery
            ? `No Stock Matches for &ldquo;${searchTitle}&rdquo;`
            : "No Vehicles Found Matching Your Criteria"}
        </Heading>
        <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
          {hasSpecificQuery
            ? "We constantly import from Tokyo USS & TAA auctions. Save this search to get an instant WhatsApp message the moment an authentic match arrives."
            : "We constantly refresh our inventory directly from USS and TAA Tokyo auctions. You can reset your filters or request our import team to source this specific chassis directly for you."}
        </p>
      </div>

      {/* Save Search Priority CTA */}
      <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[var(--accent)]">
          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="uppercase tracking-wider font-semibold">Priority Back-in-Stock Alert</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-light">
          Get notified on WhatsApp ({searchTitle}) before vehicles are published publicly.
        </p>
        <SaveSearchButton
          label={`Save &ldquo;${searchTitle}&rdquo; &bull; Get WhatsApp Alert`}
          initialCriteria={{
            make: make !== "all" ? make : undefined,
            model,
            maxPrice,
            bodyType: bodyType !== "all" ? bodyType : undefined,
          }}
          variant="solid"
          className="w-full sm:w-auto"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          href="/vehicles"
          className="w-full sm:w-auto"
        >
          Reset All Filters
        </Button>
        <Button
          variant="outline"
          size="md"
          href="/request-vehicle"
          className="w-full sm:w-auto"
        >
          Request Custom Vehicle
        </Button>
        <WhatsAppButton
          label="Auction Desk"
          message={`Hello RS Enterprises, I am searching for a ${searchTitle}. Could you check upcoming Tokyo auctions for me?`}
          variant="outline"
          size="md"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}
