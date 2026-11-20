"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SavedSearch, matchVehicleWithSavedSearch, CreateSavedSearchInput } from "@/types/saved-search";
import { Vehicle } from "@/types/vehicle";
import { formatPhoneDisplay, buildWhatsAppUrl, normalizePhoneNumber } from "@/lib/phone";
import { createSavedSearchAction } from "@/app/actions/saved-searches";
import { VehicleImage } from "@/components/ui/VehicleImage";

interface SavedSearchesManagerProps {
  savedSearches: SavedSearch[];
  vehicles: Vehicle[];
  onSendAlert: (savedSearchId: string, vehicleId: string) => Promise<void>;
  onFulfill: (savedSearchId: string) => Promise<void>;
  onDelete: (savedSearchId: string) => Promise<void>;
  onCreatedSearch?: (newSearch: SavedSearch) => void;
}

export function SavedSearchesManager({
  savedSearches,
  vehicles,
  onSendAlert,
  onFulfill,
  onDelete,
  onCreatedSearch,
}: SavedSearchesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"budget" | "date" | "matches">("matches");
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  // Add Buyer Demand Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields for New Wishlist
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addMake, setAddMake] = useState("Toyota");
  const [addModel, setAddModel] = useState("");
  const [addMaxPrice, setAddMaxPrice] = useState("");
  const [addMinYear, setAddMinYear] = useState<number | string>(2018);
  const [addMaxYear, setAddMaxYear] = useState<number | string>(2025);
  const [addBodyType, setAddBodyType] = useState("all");
  const [addFuel, setAddFuel] = useState("all");
  const [addBranch, setAddBranch] = useState("all");
  const [addNotes, setAddNotes] = useState("");

  // Compute live matches for each saved search across current published stock
  const searchesWithMatches = useMemo(() => {
    return savedSearches.map((search) => {
      const matches = vehicles.filter(
        (v) =>
          v.published &&
          v.status !== "sold" &&
          !v.archived &&
          matchVehicleWithSavedSearch(v, search)
      );
      return {
        search,
        matches,
      };
    });
  }, [savedSearches, vehicles]);

  // Aggregate Executive Metrics
  const activeSearches = savedSearches.filter((s) => s.status === "active");
  const readyToAlertCount = searchesWithMatches.filter(
    (s) => s.search.status === "active" && s.matches.length > 0
  ).length;

  const totalDemandBudget = useMemo(() => {
    return savedSearches.reduce((acc, s) => {
      return acc + (s.criteria.maxPrice || 0);
    }, 0);
  }, [savedSearches]);

  const totalNotifiedCount = useMemo(() => {
    return savedSearches.filter((s) => s.status === "notified" || (s.notificationLog && s.notificationLog.length > 0)).length;
  }, [savedSearches]);

  // Filter & Sort
  const filteredSearches = useMemo(() => {
    return searchesWithMatches
      .filter(({ search, matches }) => {
        if (statusFilter === "ready") {
          return search.status === "active" && matches.length > 0;
        }
        if (statusFilter === "active") {
          return search.status === "active";
        }
        if (statusFilter === "notified") {
          return search.status === "notified";
        }
        if (statusFilter === "fulfilled") {
          return search.status === "fulfilled";
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = search.customerName.toLowerCase().includes(q);
          const matchPhone = search.customerPhone.includes(q);
          const matchTitle = search.queryTitle.toLowerCase().includes(q);
          const matchMake = search.criteria.make?.toLowerCase().includes(q) || false;
          const matchModel = search.criteria.model?.toLowerCase().includes(q) || false;
          if (!matchName && !matchPhone && !matchTitle && !matchMake && !matchModel) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "matches") {
          if (b.matches.length !== a.matches.length) {
            return b.matches.length - a.matches.length;
          }
          return new Date(b.search.createdAt).getTime() - new Date(a.search.createdAt).getTime();
        }
        if (sortBy === "budget") {
          const budgetA = a.search.criteria.maxPrice || 0;
          const budgetB = b.search.criteria.maxPrice || 0;
          return budgetB - budgetA;
        }
        return new Date(b.search.createdAt).getTime() - new Date(a.search.createdAt).getTime();
      });
  }, [searchesWithMatches, statusFilter, searchQuery, sortBy]);

  // Handle Create Saved Search Modal Submit
  async function handleCreateWishlist(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) {
      setModalError("Please enter the prospective buyer's name.");
      return;
    }
    const cleanPhone = normalizePhoneNumber(addPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setModalError("Please enter a valid phone number (e.g. 077 123 4567).");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const inputData: CreateSavedSearchInput = {
      customerName: addName.trim(),
      customerPhone: cleanPhone,
      customerEmail: addEmail.trim() || undefined,
      make: addMake !== "all" ? addMake : undefined,
      model: addModel.trim() || undefined,
      maxPrice: addMaxPrice ? Number(addMaxPrice) : undefined,
      minYear: addMinYear ? Number(addMinYear) : undefined,
      maxYear: addMaxYear ? Number(addMaxYear) : undefined,
      bodyType: addBodyType !== "all" ? addBodyType : undefined,
      fuel: addFuel !== "all" ? addFuel : undefined,
      branch: addBranch !== "all" ? addBranch : undefined,
      notes: addNotes.trim() || undefined,
    };

    try {
      const res = await createSavedSearchAction(inputData);
      setIsSubmitting(false);

      if (res.success && res.savedSearch) {
        if (onCreatedSearch) {
          onCreatedSearch(res.savedSearch);
        }
        setShowAddModal(false);
        // Reset form
        setAddName("");
        setAddPhone("");
        setAddEmail("");
        setAddModel("");
        setAddMaxPrice("");
        setAddNotes("");
      } else {
        setModalError(res.error || "Failed to create wishlist record.");
      }
    } catch {
      setIsSubmitting(false);
      setModalError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Executive Banner & Actions */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)] to-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] relative overflow-hidden">
        {/* Subtle decorative gold ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] font-semibold">
                VIP Demand Radar &bull; Automated Showroom Matching
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal tracking-tight">
              Japanese Auction Stock Alerts &amp; Buyer Demand
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Real-time cross-referencing between prospective client requests and live Japanese auction intake.
              When matching chassis dock or arrive at our Kaduruwela showroom, dispatch verified WhatsApp alerts in 1 click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="h-11 px-5 inline-flex items-center gap-2 text-xs font-sans uppercase font-medium tracking-[0.14em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all rounded-[2px] cursor-pointer shadow-md active:scale-[0.98]"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>+ Record Buyer Wishlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive 4-Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1.5 relative overflow-hidden group hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Monitored Demands
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-light text-[var(--text-primary)]">
              {savedSearches.length}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              ({activeSearches.length} active)
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-light">
            Prospective buyers waiting for auction units
          </p>
        </div>

        {/* Metric 2: Ready to Alert (Highlight) */}
        <div className={`p-5 bg-[var(--bg-surface)] border rounded-[2px] space-y-1.5 relative overflow-hidden transition-all ${
          readyToAlertCount > 0
            ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)] bg-gradient-to-b from-emerald-950/20 to-[var(--bg-surface)]"
            : "border-[var(--border-hairline)]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400 font-semibold flex items-center gap-1">
              <span>⚡</span>
              <span>Ready for Dispatch</span>
            </span>
            {readyToAlertCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                Action Ready
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-normal text-emerald-400">
              {readyToAlertCount}
            </span>
            <span className="text-xs font-mono text-emerald-300/80">
              Chassis Matched
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-light">
            Buyers with identical cars currently in showroom stock
          </p>
        </div>

        {/* Metric 3: Total Buying Capital */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1.5 group hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold">
              Tracked Buying Budget
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-mono text-[var(--accent)]">LKR</span>
            <span className="font-serif text-3xl font-light text-[var(--text-primary)]">
              {totalDemandBudget > 0 ? (totalDemandBudget / 1000000).toFixed(1) : "0"}M
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-light">
            Cumulative purchasing capacity in tracked wishlists
          </p>
        </div>

        {/* Metric 4: Alert Dispatch History */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1.5 group hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Dispatched Alerts
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-light text-[var(--text-primary)]">
              {totalNotifiedCount}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              VIP Notifications
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-light">
            Verified WhatsApp dossiers sent to prospective buyers
          </p>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by buyer name, phone (+94), vehicle model (e.g. Prado, Vezel, Harrier)..."
              className="w-full h-11 pl-10 pr-9 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hidden sm:inline">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "budget" | "date" | "matches")}
              className="h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="matches">Most Showroom Matches First</option>
              <option value="budget">Highest Budget (LKR)</option>
              <option value="date">Newest Demand Recorded</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
              statusFilter === "all"
                ? "bg-[var(--accent)] text-white border-[var(--accent)] font-medium"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Demands ({savedSearches.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("ready")}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer border flex items-center gap-1.5 ${
              statusFilter === "ready"
                ? "bg-emerald-600 text-white border-emerald-600 font-medium"
                : "bg-[var(--bg-surface)] text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60"
            }`}
          >
            <span>⚡ Ready to Alert</span>
            <span className="font-mono px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
              {readyToAlertCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
              statusFilter === "active"
                ? "bg-[var(--accent)] text-white border-[var(--accent)] font-medium"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
            }`}
          >
            Active Watch ({activeSearches.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("notified")}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
              statusFilter === "notified"
                ? "bg-[var(--accent)] text-white border-[var(--accent)] font-medium"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
            }`}
          >
            Alert Sent ({totalNotifiedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("fulfilled")}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
              statusFilter === "fulfilled"
                ? "bg-[var(--accent)] text-white border-[var(--accent)] font-medium"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
            }`}
          >
            Fulfilled ({savedSearches.filter((s) => s.status === "fulfilled").length})
          </button>
        </div>
      </div>

      {/* 4. Luxury Buyer Demands List */}
      {filteredSearches.length === 0 ? (
        <div className="py-20 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-secondary)]">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-[var(--text-primary)]">
              No Matching Buyer Wishlists
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-light max-w-md mx-auto">
              {searchQuery
                ? `No stock alerts matching "${searchQuery}". Try clearing search filters.`
                : "No saved buyer requests found in this filter scope. Click '+ Record Buyer Wishlist' to log a walk-in client."}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs font-mono uppercase text-[var(--accent)] underline hover:no-underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSearches.map(({ search, matches }) => {
            const hasMatches = matches.length > 0;
            const waDirectUrl = buildWhatsAppUrl(
              search.customerPhone,
              `Hello ${search.customerName}, this is RS Enterprises Showroom regarding your vehicle inquiry.`
            );

            // Get initials for avatar
            const initials = search.customerName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join("");

            return (
              <div
                key={search.id}
                className={`bg-[var(--bg-surface)] border rounded-[2px] transition-all overflow-hidden ${
                  hasMatches && search.status === "active"
                    ? "border-[var(--accent)] shadow-[0_0_24px_rgba(212,175,55,0.09)]"
                    : "border-[var(--border-hairline)] hover:border-[var(--border-subtle)]"
                }`}
              >
                {/* Immediate Match Ribbon Header (If matches in stock) */}
                {hasMatches && search.status === "active" && (
                  <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-5 py-2 flex items-center justify-between text-white text-xs font-mono uppercase tracking-wider font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <span>Showroom Match Ready &bull; {matches.length} Vehicle{matches.length === 1 ? "" : "s"} Available Now</span>
                    </span>
                    <span className="text-[10px] tracking-widest opacity-95">
                      Ready for WhatsApp Dispatch
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-7 space-y-6">
                  {/* Row 1: Buyer Profile & Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
                    <div className="flex items-center gap-3.5">
                      {/* Monogram Avatar */}
                      <div className="w-11 h-11 rounded-full bg-[var(--bg-base)] border border-[var(--accent)]/40 flex items-center justify-center font-serif text-base font-normal text-[var(--accent)] shrink-0 shadow-inner">
                        {initials || "VP"}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-serif text-xl text-[var(--text-primary)] font-medium">
                            {search.customerName}
                          </h3>
                          <span className="text-xs font-mono text-[var(--text-secondary)]">
                            {formatPhoneDisplay(search.customerPhone)}
                          </span>
                          <a
                            href={waDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-[1px] hover:bg-emerald-500/25 transition-colors font-semibold cursor-pointer"
                            title="Open direct WhatsApp conversation"
                          >
                            <span>WhatsApp Direct</span>
                            <span className="text-[9px]">↗</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-light">
                          {search.customerEmail && (
                            <span className="font-mono text-[11px] text-[var(--text-muted)]">
                              {search.customerEmail}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            Registered {new Date(search.createdAt).toLocaleDateString("en-LK", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                          search.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : search.status === "notified"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            search.status === "active"
                              ? "bg-emerald-400 animate-pulse"
                              : search.status === "notified"
                              ? "bg-amber-400"
                              : "bg-slate-400"
                          }`}
                        />
                        <span>
                          {search.status === "active"
                            ? "Active Monitoring"
                            : search.status === "notified"
                            ? "Alert Sent"
                            : "Fulfilled / Acquired"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Target Criteria Specification Matrix */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Wishlist Target Query:
                        </span>
                        <h4 className="font-serif text-2xl text-[var(--accent)] font-normal tracking-tight">
                          &ldquo;{search.queryTitle}&rdquo;
                        </h4>
                      </div>

                      {search.criteria.maxPrice && (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                            Target Budget Ceiling
                          </span>
                          <span className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-light tabular-nums">
                            LKR {search.criteria.maxPrice.toLocaleString("en-US")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specification Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                      {search.criteria.make && search.criteria.make !== "all" && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)]">
                          Brand: <strong className="font-semibold">{search.criteria.make}</strong>
                        </span>
                      )}
                      {(search.criteria.model || search.criteria.keyword) && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)]">
                          Model: <strong className="font-semibold">{search.criteria.model || search.criteria.keyword}</strong>
                        </span>
                      )}
                      {(search.criteria.minYear || search.criteria.maxYear) && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                          Year: {search.criteria.minYear || "Any"} – {search.criteria.maxYear || "Present"}
                        </span>
                      )}
                      {search.criteria.bodyType && search.criteria.bodyType !== "all" && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                          Body: {search.criteria.bodyType.toUpperCase()}
                        </span>
                      )}
                      {search.criteria.fuel && search.criteria.fuel !== "all" && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                          Fuel: {search.criteria.fuel.toUpperCase()}
                        </span>
                      )}
                      {search.criteria.branch && search.criteria.branch !== "all" && (
                        <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                          Branch: {search.criteria.branch === "trincomalee" ? "Trincomalee" : "Kaduruwela"}
                        </span>
                      )}
                    </div>

                    {/* Customer Notes Quote */}
                    {search.notes && (
                      <div className="p-3 bg-[var(--bg-base)] border-l-2 border-[var(--accent)] text-xs text-[var(--text-secondary)] font-light italic rounded-r-[2px]">
                        &ldquo;{search.notes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Row 3: Matching Showroom Inventory Units */}
                  <div className="pt-2">
                    {hasMatches ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-1.5">
                            <span className="text-emerald-400">●</span>
                            <span>Matching Showroom Units Available for Dispatch ({matches.length})</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {matches.map((v) => {
                            const isAlreadyNotified = search.matchedVehicleIds.includes(v.id);
                            const isSending = sendingAlertId === `${search.id}-${v.id}`;
                            const primaryImage = v.images[0] || "/images/vehicles/placeholder-coming-soon.png";

                            return (
                              <div
                                key={v.id}
                                className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--accent)]/40 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  {/* Vehicle Thumbnail */}
                                  <div className="w-20 shrink-0">
                                    <VehicleImage
                                      src={primaryImage}
                                      alt={`${v.year} ${v.make} ${v.model}`}
                                      aspectRatio="16/10"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Link
                                        href={`/vehicles/${v.slug}`}
                                        target="_blank"
                                        className="font-serif text-lg text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors underline font-medium"
                                      >
                                        {v.year} {v.make} {v.model}
                                      </Link>
                                      {v.grade && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)] uppercase">
                                          {v.grade}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                                      <span className="text-[var(--accent)] font-semibold text-sm">
                                        {v.price ? `LKR ${v.price.toLocaleString("en-US")}` : "Price on Call"}
                                      </span>
                                      <span>&bull;</span>
                                      <span>{v.mileage.toLocaleString("en-US")} KM</span>
                                      <span>&bull;</span>
                                      <span className="capitalize">{v.branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Showroom"}</span>
                                      {isAlreadyNotified && (
                                        <>
                                          <span>&bull;</span>
                                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                            <span>✓</span>
                                            <span>Alert Previously Sent</span>
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Dispatch Trigger Button */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <Link
                                    href={`/vehicles/${v.slug}`}
                                    target="_blank"
                                    className="px-3 py-2 text-xs font-mono uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] transition-colors"
                                  >
                                    View Dossier ↗
                                  </Link>

                                  <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={async () => {
                                      setSendingAlertId(`${search.id}-${v.id}`);
                                      await onSendAlert(search.id, v.id);
                                      setSendingAlertId(null);
                                    }}
                                    className={`min-h-[42px] px-5 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-[0.12em] rounded-[2px] cursor-pointer transition-all shadow-md disabled:opacity-50 ${
                                      isAlreadyNotified
                                        ? "bg-[var(--bg-surface)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    }`}
                                  >
                                    {isSending ? (
                                      <span>Opening WhatsApp...</span>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.222-.556-1.528-.631-2.518-2.183-2.593-2.285-.075-.102-.622-.828-.622-1.58 0-.752.39-1.121.529-1.272.138-.15.302-.188.404-.188.102 0 .204.001.294.006.094.004.22-.036.344.262.129.311.442 1.077.481 1.156.039.078.065.17.013.272-.051.102-.077.165-.152.253-.075.088-.158.197-.225.265-.076.076-.155.158-.067.31.088.152.393.649.843 1.05.58.517 1.07.677 1.222.753.152.076.241.063.33-.038.089-.102.381-.444.483-.596.102-.152.204-.127.343-.076.139.051.884.417 1.036.493.153.076.255.114.293.178.038.064.038.37-.106.775z" />
                                        </svg>
                                        <span>{isAlreadyNotified ? "Re-send WhatsApp Alert" : "Send WhatsApp Alert"}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* No matches currently in showroom: Radar Scanning Box */
                      <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                          <div>
                            <span className="text-[var(--text-primary)] font-medium block">
                              Automated Tokyo Auction Radar Active
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] font-light">
                              0 units currently in Kaduruwela showroom. System scans every new auction allocation for this specification.
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-left sm:text-right font-mono text-[10px] text-[var(--text-muted)]">
                          USS Tokyo &bull; TAA &bull; ARAI
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Card Footer & Notification Logs */}
                  <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Log status */}
                    <div>
                      {search.notificationLog && search.notificationLog.length > 0 ? (
                        <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-2">
                          <span className="text-[var(--accent)] font-semibold">Latest Alert:</span>
                          <span>
                            {search.notificationLog[0]?.vehicleTitle} &bull;{" "}
                            {new Date(search.notificationLog[0]?.notifiedAt || "").toLocaleDateString("en-LK", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          No alerts dispatched yet for this buyer.
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {search.status !== "fulfilled" ? (
                        <button
                          type="button"
                          onClick={() => onFulfill(search.id)}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/40 transition-colors rounded-[2px] cursor-pointer"
                        >
                          ✓ Mark as Fulfilled
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onFulfill(search.id)}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors rounded-[2px] cursor-pointer"
                        >
                          ↺ Re-activate Alert
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDelete(search.id)}
                        className="text-[10px] font-mono uppercase text-[var(--text-secondary)] hover:text-red-400 transition-colors cursor-pointer px-1"
                      >
                        Delete Wishlist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add Buyer Demand Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-8 space-y-6 shadow-2xl z-10 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border-hairline)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
                  Walk-In &bull; Telephone Intake
                </span>
                <h3 className="font-serif text-2xl text-[var(--text-primary)] font-normal mt-1">
                  Record Buyer Demand Wishlist
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                  Save prospective client requirements to auto-match against auction intake and current stock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 text-xs rounded-[2px]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateWishlist} className="space-y-4">
              {/* Buyer Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Dr. Rohan Jayasinghe"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="customer@domain.lk"
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Target Vehicle Details */}
              <div className="pt-2 border-t border-[var(--border-hairline)] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Target Make / Brand
                    </label>
                    <select
                      value={addMake}
                      onChange={(e) => setAddMake(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                    >
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Nissan">Nissan</option>
                      <option value="Mitsubishi">Mitsubishi</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="all">Any Japanese Make</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Model / Keyword
                    </label>
                    <input
                      type="text"
                      value={addModel}
                      onChange={(e) => setAddModel(e.target.value)}
                      placeholder="e.g. Prado, Vezel, X-Trail, Harrier"
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Max Budget (LKR)
                    </label>
                    <input
                      type="number"
                      value={addMaxPrice}
                      onChange={(e) => setAddMaxPrice(e.target.value)}
                      placeholder="e.g. 25000000"
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                    />
                    {addMaxPrice && Number(addMaxPrice) > 0 && (
                      <span className="text-[10px] font-mono text-[var(--accent)] block">
                        ≈ LKR {(Number(addMaxPrice) / 1000000).toFixed(2)} Million
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Preferred Branch
                    </label>
                    <select
                      value={addBranch}
                      onChange={(e) => setAddBranch(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                    >
                      <option value="all">Any Branch</option>
                      <option value="polonnaruwa">Kaduruwela Main</option>
                      <option value="trincomalee">Trincomalee</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Min Year
                    </label>
                    <input
                      type="number"
                      value={addMinYear}
                      onChange={(e) => setAddMinYear(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Max Year
                    </label>
                    <input
                      type="number"
                      value={addMaxYear}
                      onChange={(e) => setAddMaxYear(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Powertrain
                    </label>
                    <select
                      value={addFuel}
                      onChange={(e) => setAddFuel(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] cursor-pointer"
                    >
                      <option value="all">Any Fuel Type</option>
                      <option value="hybrid">Hybrid / e-POWER</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Body Type
                    </label>
                    <select
                      value={addBodyType}
                      onChange={(e) => setAddBodyType(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] cursor-pointer"
                    >
                      <option value="all">Any Body Type</option>
                      <option value="suv">SUV</option>
                      <option value="sedan">Sedan</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="wagon">Wagon</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                    Specific Buyer Remarks &bull; Color / Packages
                  </label>
                  <textarea
                    rows={2}
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="e.g. Pearl White only, Sunroof preferred, 7-seater configuration."
                    className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-mono uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 inline-flex items-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all rounded-[2px] cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Registering Demand..." : "Save Buyer Wishlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
