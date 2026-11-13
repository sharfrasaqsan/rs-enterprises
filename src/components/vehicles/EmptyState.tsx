import React from "react";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export function EmptyState() {
  return (
    <div className="py-20 sm:py-28 text-center border-t border-[var(--border-hairline)] space-y-6 max-w-xl mx-auto">
      <div className="space-y-3">
        <Eyebrow>No Showroom Matches</Eyebrow>
        <Heading level={3}>
          No Vehicles Found Matching Your Criteria
        </Heading>
        <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
          We constantly refresh our inventory directly from USS and TAA Tokyo auctions.
          You can reset your filters or request our import team to source this specific chassis directly for you.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/vehicles"
          className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-xs font-sans uppercase font-medium tracking-[0.16em] transition-luxury w-full sm:w-auto"
        >
          Reset All Filters
        </Link>
        <WhatsAppButton
          label="Request Custom Auction Bidding"
          message="Hello RS Enterprises, I could not find my required vehicle in your showroom stock. Could you please check upcoming Japanese auction listings for me?"
          variant="outline"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}

