"use client";

import React, { useState } from "react";
import { createSavedSearchAction } from "@/app/actions/saved-searches";
import { formatPhoneDisplay, normalizePhoneNumber } from "@/lib/phone";
import { SavedSearch, generateSearchTitle } from "@/types/saved-search";
import { Vehicle } from "@/types/vehicle";
import Link from "next/link";

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCriteria?: {
    make?: string;
    model?: string;
    keyword?: string;
    maxPrice?: number | null;
    bodyType?: string;
    branch?: string;
  };
  onSuccess?: (savedSearch: SavedSearch) => void;
}

interface SaveSearchModalInnerProps {
  initialCriteria?: {
    make?: string;
    model?: string;
    keyword?: string;
    maxPrice?: number | null;
    bodyType?: string;
    branch?: string;
  };
  onClose: () => void;
  onSuccess?: (savedSearch: SavedSearch) => void;
}

function SaveSearchModalInner({
  initialCriteria,
  onClose,
  onSuccess,
}: SaveSearchModalInnerProps) {
  const defaultTitle = generateSearchTitle({
    make: initialCriteria?.make,
    model: initialCriteria?.model,
    keyword: initialCriteria?.keyword,
    maxPrice: initialCriteria?.maxPrice,
    bodyType: initialCriteria?.bodyType,
  });

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [queryTitle, setQueryTitle] = useState(defaultTitle);
  const [make, setMake] = useState(initialCriteria?.make && initialCriteria.make !== "all" ? initialCriteria.make : "");
  const [model, setModel] = useState(initialCriteria?.model || initialCriteria?.keyword || "");
  const [maxPrice, setMaxPrice] = useState<string>(
    initialCriteria?.maxPrice ? String(initialCriteria.maxPrice) : ""
  );
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<{
    search: SavedSearch;
    existingMatches: Vehicle[];
  } | null>(null);

  const normalizedPhone = normalizePhoneNumber(customerPhone);
  const isPhoneValid = normalizedPhone.length >= 10;

  // Preset budget pills
  function applyBudgetPreset(amount: number) {
    setMaxPrice(String(amount));
    // Update title to match
    const newTitle = generateSearchTitle({
      make,
      model,
      maxPrice: amount,
    });
    setQueryTitle(newTitle);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please provide your name.");
      return;
    }

    if (!isPhoneValid) {
      setError("Please enter a valid Sri Lankan mobile number (e.g. 077 123 4567).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsedPrice = maxPrice ? parseFloat(maxPrice.replace(/[^0-9.]/g, "")) : null;

    const res = await createSavedSearchAction({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      queryTitle: queryTitle.trim() || undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      keyword: model.trim() || undefined,
      maxPrice: parsedPrice && parsedPrice > 0 ? parsedPrice : null,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.savedSearch) {
      // Save alert to visitor local storage
      try {
        const stored = localStorage.getItem("rs_user_saved_searches");
        const list = stored ? JSON.parse(stored) : [];
        const updated = [res.savedSearch, ...list.filter((s: { id: string }) => s.id !== res.savedSearch!.id)];
        localStorage.setItem("rs_user_saved_searches", JSON.stringify(updated));
      } catch {
        // ignore
      }

      setSavedResult({
        search: res.savedSearch,
        existingMatches: res.existingMatches || [],
      });

      if (onSuccess) {
        onSuccess(res.savedSearch);
      }
    } else {
      setError(res.error || "Failed to save search alert. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-search-title"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-6 sm:p-8 my-8 text-[var(--text-primary)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {savedResult ? (
          /* Success Screen */
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] block">
                Alert Active &bull; Tokyo Auction Monitoring
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] font-medium">
                Saved &ldquo;{savedResult.search.queryTitle}&rdquo;
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light max-w-sm mx-auto leading-relaxed">
                We will alert your WhatsApp ({formatPhoneDisplay(savedResult.search.customerPhone)}) the moment an authentic match lands at Kaduruwela showroom or passes Tokyo auction inspection.
              </p>
            </div>

            {/* Existing Matches Callout if any */}
            {savedResult.existingMatches.length > 0 && (
              <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-left rounded-[2px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)]">
                    Current Showroom Matches ({savedResult.existingMatches.length})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">In Stock Now</span>
                </div>
                {savedResult.existingMatches.slice(0, 2).map((match) => (
                  <div key={match.id} className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-hairline)]">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {match.year} {match.make} {match.model}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {match.price ? `LKR ${match.price.toLocaleString("en-US")}` : "Call for price"} • {match.branch === "trincomalee" ? "Trincomalee" : "Kaduruwela"}
                      </p>
                    </div>
                    <Link
                      href={`/vehicles/${match.slug}`}
                      onClick={onClose}
                      className="px-2.5 py-1 text-[10px] font-sans uppercase font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[1px]"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-6 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="space-y-5">
            <div className="space-y-1 pb-4 border-b border-[var(--border-hairline)]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] block">
                Japanese Auction &amp; Inventory Alert
              </span>
              <h2 id="save-search-title" className="font-serif text-2xl sm:text-3xl font-medium">
                Save Search &amp; Back-in-Stock Alert
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                Save your dream specification (e.g. &ldquo;Prado under 20M&rdquo;). Receive an instant WhatsApp notification the moment a verified match is added to our showroom or shipping manifest.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert Title */}
              <div className="space-y-1">
                <label htmlFor="search-title" className="block text-[11px] font-mono uppercase tracking-wider text-[var(--accent)]">
                  Alert Label
                </label>
                <input
                  id="search-title"
                  type="text"
                  required
                  value={queryTitle}
                  onChange={(e) => setQueryTitle(e.target.value)}
                  placeholder="e.g. Prado under 20M"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Make & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="search-make" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Make / Manufacturer
                  </label>
                  <input
                    id="search-make"
                    type="text"
                    value={make}
                    onChange={(e) => {
                      setMake(e.target.value);
                      setQueryTitle(generateSearchTitle({ make: e.target.value, model, maxPrice: maxPrice ? Number(maxPrice) : null }));
                    }}
                    placeholder="e.g. Toyota"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="search-model" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Model / Trim
                  </label>
                  <input
                    id="search-model"
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setQueryTitle(generateSearchTitle({ make, model: e.target.value, maxPrice: maxPrice ? Number(maxPrice) : null }));
                    }}
                    placeholder="e.g. Prado / Land Cruiser"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Max Budget & Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="search-budget" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Maximum Budget (LKR)
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent)]">
                    {maxPrice ? `LKR ${(Number(maxPrice) / 1000000).toFixed(0)}M` : "Any Budget"}
                  </span>
                </div>
                <input
                  id="search-budget"
                  type="number"
                  step="500000"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setQueryTitle(generateSearchTitle({ make, model, maxPrice: e.target.value ? Number(e.target.value) : null }));
                  }}
                  placeholder="20,000,000 (20M)"
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />

                {/* Quick Budget Pills */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] self-center mr-1">Quick:</span>
                  {[10000000, 15000000, 20000000, 25000000, 35000000, 50000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => applyBudgetPreset(amt)}
                      className={`px-2 py-0.5 text-[9px] font-mono uppercase border transition-colors cursor-pointer ${
                        maxPrice === String(amt)
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--bg-base)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {amt / 1000000}M
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice("");
                      setQueryTitle(generateSearchTitle({ make, model, maxPrice: null }));
                    }}
                    className="px-2 py-0.5 text-[9px] font-mono uppercase border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Any
                  </button>
                </div>
              </div>

              {/* Buyer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-hairline)]">
                <div className="space-y-1">
                  <label htmlFor="search-name" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Your Full Name *
                  </label>
                  <input
                    id="search-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Dr. K. Jayasundara"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="search-phone" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    WhatsApp Phone *
                  </label>
                  <input
                    id="search-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {customerPhone && (
                    <p className={`text-[10px] font-mono ${isPhoneValid ? "text-[var(--accent)]" : "text-amber-400"}`}>
                      {isPhoneValid ? `WhatsApp: ${formatPhoneDisplay(customerPhone)}` : "Enter 10-digit Sri Lankan number"}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Notes & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="search-email" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Email Address (Optional)
                  </label>
                  <input
                    id="search-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. buyer@example.com"
                    className="w-full h-9 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="search-notes" className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    Specific Options (Optional)
                  </label>
                  <input
                    id="search-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Black/Pearl White, sunroof, low km"
                    className="w-full h-9 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>Saving Alert...</span>
                    </div>
                  ) : (
                    <span>Save Alert &bull; Notify on WhatsApp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function SaveSearchModal(props: SaveSearchModalProps) {
  if (!props.isOpen) return null;

  return (
    <SaveSearchModalInner
      key={`${props.initialCriteria?.make}-${props.initialCriteria?.model}-${props.initialCriteria?.maxPrice}`}
      initialCriteria={props.initialCriteria}
      onClose={props.onClose}
      onSuccess={props.onSuccess}
    />
  );
}
