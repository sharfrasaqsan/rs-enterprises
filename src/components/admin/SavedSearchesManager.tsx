"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  SavedSearch,
  matchVehicleWithSavedSearch,
  CreateSavedSearchInput,
} from "@/types/saved-search";
import { Vehicle } from "@/types/vehicle";
import { formatPhoneDisplay, buildWhatsAppUrl, normalizePhoneNumber } from "@/lib/phone";
import { createSavedSearchAction } from "@/app/actions/saved-searches";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { AdminPagination } from "@/components/admin/AdminPagination";

interface SavedSearchesManagerProps {
  savedSearches: SavedSearch[];
  vehicles: Vehicle[];
  onSendAlert: (savedSearchId: string, vehicleId: string) => Promise<void>;
  onFulfill: (savedSearchId: string) => Promise<void>;
  onDelete: (savedSearchId: string) => Promise<void>;
  onCreatedSearch?: (newSearch: SavedSearch) => void;
  externalOpenAddModal?: boolean;
  onCloseExternalModal?: () => void;
}

export function SavedSearchesManager({
  savedSearches,
  vehicles,
  onSendAlert,
  onFulfill,
  onDelete,
  onCreatedSearch,
  externalOpenAddModal = false,
  onCloseExternalModal,
}: SavedSearchesManagerProps) {
  // View mode: split (master-detail), table (high-density), or grid (2-col cards)
  const [viewMode, setViewMode] = useState<"split" | "table" | "grid">("split");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"matches" | "budget" | "date">("matches");
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  // Selected item in Master-Detail Split view
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);

  // Mobile detail view toggle for Split view on small screens
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Pagination for Table & Grid views
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(10);

  // Add Buyer Demand Modal State
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const showAddModal = internalShowAddModal || externalOpenAddModal;

  const handleCloseModal = () => {
    setInternalShowAddModal(false);
    if (onCloseExternalModal) onCloseExternalModal();
  };
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

  // Executive Metrics
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
    return savedSearches.filter(
      (s) => s.status === "notified" || (s.notificationLog && s.notificationLog.length > 0)
    ).length;
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
          return search.status === "notified" || (search.notificationLog && search.notificationLog.length > 0);
        }
        if (statusFilter === "fulfilled") {
          return search.status === "fulfilled";
        }
        return true;
      })
      .filter(({ search }) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = search.customerName.toLowerCase().includes(q);
        const phoneMatch = search.customerPhone.includes(q);
        const titleMatch = search.queryTitle.toLowerCase().includes(q);
        const makeMatch = (search.criteria.make || "").toLowerCase().includes(q);
        const modelMatch = (search.criteria.model || "").toLowerCase().includes(q);
        const notesMatch = (search.notes || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || titleMatch || makeMatch || modelMatch || notesMatch;
      })
      .sort((a, b) => {
        if (sortBy === "matches") {
          const matchDiff = b.matches.length - a.matches.length;
          if (matchDiff !== 0) return matchDiff;
          return new Date(b.search.createdAt).getTime() - new Date(a.search.createdAt).getTime();
        }
        if (sortBy === "budget") {
          return (b.search.criteria.maxPrice || 0) - (a.search.criteria.maxPrice || 0);
        }
        if (sortBy === "date") {
          return new Date(b.search.createdAt).getTime() - new Date(a.search.createdAt).getTime();
        }
        return 0;
      });
  }, [searchesWithMatches, statusFilter, searchQuery, sortBy]);

  // Active selected item for Master-Detail Split Studio
  const activeDetail = useMemo(() => {
    if (filteredSearches.length === 0) return null;
    if (selectedSearchId) {
      const found = filteredSearches.find((item) => item.search.id === selectedSearchId);
      if (found) return found;
    }
    return filteredSearches[0];
  }, [filteredSearches, selectedSearchId]);

  // Paginated Slices for Table & Grid Views (10 items per page min)
  const paginatedTableItems = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredSearches.slice(start, start + tablePageSize);
  }, [filteredSearches, tablePage, tablePageSize]);

  const paginatedGridItems = useMemo(() => {
    const start = (gridPage - 1) * gridPageSize;
    return filteredSearches.slice(start, start + gridPageSize);
  }, [filteredSearches, gridPage, gridPageSize]);

  // Reset page when filter changes
  function handleFilterChange(newFilter: string) {
    setStatusFilter(newFilter);
    setTablePage(1);
    setGridPage(1);
  }

  function handleSearchChange(newQuery: string) {
    setSearchQuery(newQuery);
    setTablePage(1);
    setGridPage(1);
  }

  // Handle Create New Wishlist Submission
  async function handleAddWishlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!addName.trim()) {
      setModalError("Please enter the prospective buyer's name.");
      return;
    }
    if (!addPhone.trim()) {
      setModalError("Please enter a valid phone or WhatsApp number.");
      return;
    }

    setIsSubmitting(true);
    const inputData: CreateSavedSearchInput = {
      customerName: addName.trim(),
      customerPhone: normalizePhoneNumber(addPhone.trim()),
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
        handleCloseModal();
        // Select newly added search
        setSelectedSearchId(res.savedSearch.id);
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
    <div className="space-y-6">
      {/* 1. Executive Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold">
              VIP Demand Radar &bull; Automated Showroom Matching
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal tracking-tight">
            Saved Searches &amp; Stock Alerts
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Real-time cross-referencing between client demands and Japanese auction intake. 1-click WhatsApp dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* View Mode Switcher */}
          <div className="inline-flex p-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
            <button
              type="button"
              onClick={() => {
                setViewMode("split");
                setShowMobileDetail(false);
              }}
              className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                viewMode === "split"
                  ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Executive Split Studio (Master-Detail)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M10 3v18" />
              </svg>
              <span>Split Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="High-Density Table View for Fast Triage"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="2-Column Card Grid"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Grid</span>
            </button>
          </div>

          {/* Record Buyer Demand Button */}
          <button
            type="button"
            onClick={() => setInternalShowAddModal(true)}
            className="h-10 px-4 inline-flex items-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all rounded-[2px] cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>+ Record Buyer Wishlist</span>
          </button>
        </div>
      </div>

      {/* 2. Executive 4-Metric KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1 hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Demands Tracked
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              {savedSearches.length}
            </span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              ({activeSearches.length} active)
            </span>
          </div>
        </div>

        {/* Metric 2: Ready to Alert */}
        <div
          className={`p-4 bg-[var(--bg-surface)] border rounded-[2px] space-y-1 transition-all ${
            readyToAlertCount > 0
              ? "border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.08)] bg-gradient-to-b from-emerald-950/20 to-[var(--bg-surface)]"
              : "border-[var(--border-hairline)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-400 font-semibold flex items-center gap-1">
              <span>⚡</span>
              <span>Ready to Dispatch</span>
            </span>
            {readyToAlertCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold animate-pulse">
                Action Ready
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-normal text-emerald-400">
              {readyToAlertCount}
            </span>
            <span className="text-[11px] font-mono text-emerald-300/80">
              Chassis Matched
            </span>
          </div>
        </div>

        {/* Metric 3: Total Buying Capital */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1 hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)] font-semibold">
              Buying Budget
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-mono text-[var(--accent)]">LKR</span>
            <span className="font-serif text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              {totalDemandBudget > 0 ? (totalDemandBudget / 1000000).toFixed(1) : "0"}M
            </span>
          </div>
        </div>

        {/* Metric 4: Alert Dispatch History */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1 hover:border-[var(--accent)]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Alerts Dispatched
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              {totalNotifiedCount}
            </span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Notifications Sent
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by buyer name, phone (+94), car model (Prado, Vezel, Harrier)..."
              className="w-full h-10 pl-10 pr-9 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "matches" | "budget" | "date")}
              className="h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="matches">Showroom Matches First</option>
              <option value="budget">Highest Budget (LKR)</option>
              <option value="date">Newest Registered</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
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
            onClick={() => handleFilterChange("ready")}
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
            onClick={() => handleFilterChange("active")}
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
            onClick={() => handleFilterChange("notified")}
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
            onClick={() => handleFilterChange("fulfilled")}
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

      {/* 4. MAIN CONTENT AREA */}
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
                handleSearchChange("");
                handleFilterChange("all");
              }}
              className="text-xs font-mono uppercase text-[var(--accent)] underline hover:no-underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === "split" ? (
        /* ============================================================
           MODE A: EXECUTIVE SPLIT STUDIO (MASTER-DETAIL)
           ============================================================ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Master Buyer Queue (5 cols on lg, 4 on xl) */}
          <div
            className={`lg:col-span-5 xl:col-span-4 space-y-3 ${
              showMobileDetail ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Buyer Queue ({filteredSearches.length})
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Click to inspect dossier
              </span>
            </div>

            <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
              {filteredSearches.map(({ search, matches }) => {
                const isSelected = activeDetail?.search.id === search.id;
                const hasMatches = matches.length > 0;
                const waUrl = buildWhatsAppUrl(
                  search.customerPhone,
                  `Hello ${search.customerName}, this is RS Enterprises Showroom regarding your inquiry for ${search.queryTitle}.`
                );

                return (
                  <div
                    key={search.id}
                    onClick={() => {
                      setSelectedSearchId(search.id);
                      setShowMobileDetail(true);
                    }}
                    className={`p-4 rounded-[2px] border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-[0_0_15px_rgba(212,175,55,0.12)] ring-1 ring-[var(--accent)]"
                        : "bg-[var(--bg-surface)] border-[var(--border-hairline)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-base)]"
                    }`}
                  >
                    {/* Top Row: Customer & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base text-[var(--text-primary)] font-medium">
                          {search.customerName}
                        </span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Direct WhatsApp Chat"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.222-.556-1.528-.631-2.518-2.183-2.593-2.285-.075-.102-.622-.828-.622-1.58 0-.752.39-1.121.529-1.272.138-.15.302-.188.404-.188.102 0 .204.001.294.006.094.004.22-.036.344.262.129.311.442 1.077.481 1.156.039.078.065.17.013.272-.051.102-.077.165-.152.253-.075.088-.158.197-.225.265-.076.076-.155.158-.067.31.088.152.393.649.843 1.05.58.517 1.07.677 1.222.753.152.076.241.063.33-.038.089-.102.381-.444.483-.596.102-.152.204-.127.343-.076.139.051.884.417 1.036.493.153.076.255.114.293.178.038.064.038.37-.106.775z" />
                          </svg>
                        </a>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          search.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                            : search.status === "notified"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {search.status === "active"
                          ? "Active"
                          : search.status === "notified"
                          ? "Alerted"
                          : "Fulfilled"}
                      </span>
                    </div>

                    {/* Middle: Target Car Inquiry */}
                    <div className="mt-1">
                      <span className="font-serif text-sm text-[var(--accent)] font-medium block truncate">
                        &ldquo;{search.queryTitle}&rdquo;
                      </span>
                      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] mt-1">
                        <span>{formatPhoneDisplay(search.customerPhone)}</span>
                        {search.criteria.maxPrice && (
                          <span className="text-[var(--text-primary)] font-medium">
                            Max LKR {(search.criteria.maxPrice / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Match Counter or Radar Status */}
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] font-mono">
                      {hasMatches ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>⚡ {matches.length} Showroom Unit{matches.length === 1 ? "" : "s"} Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>Auction Radar Active</span>
                        </span>
                      )}

                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(search.createdAt).toLocaleDateString("en-LK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Match Studio Dossier (7 cols on lg, 8 on xl) */}
          <div
            className={`lg:col-span-7 xl:col-span-8 ${
              showMobileDetail ? "block" : "hidden lg:block"
            }`}
          >
            {activeDetail ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileDetail(false)}
                  className="lg:hidden mb-2 inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[var(--accent)] cursor-pointer"
                >
                  <span>← Back to Buyer Queue</span>
                </button>

                {/* Section A: Buyer Profile & Contact Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[var(--border-hairline)]">
                  <div className="flex items-center gap-3.5">
                    {/* Initials Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-base)] border border-[var(--accent)]/40 flex items-center justify-center font-serif text-lg font-normal text-[var(--accent)] shrink-0 shadow-inner">
                      {activeDetail.search.customerName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0].toUpperCase())
                        .join("") || "VP"}
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-[var(--text-primary)] font-medium">
                        {activeDetail.search.customerName}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap mt-0.5">
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          {formatPhoneDisplay(activeDetail.search.customerPhone)}
                        </span>
                        <a
                          href={buildWhatsAppUrl(
                            activeDetail.search.customerPhone,
                            `Hello ${activeDetail.search.customerName}, this is RS Enterprises Showroom regarding your vehicle inquiry.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-[1px] hover:bg-emerald-500/25 transition-colors font-semibold cursor-pointer"
                        >
                          <span>WhatsApp Direct</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                        {activeDetail.search.customerEmail && (
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {activeDetail.search.customerEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Status Badge & Delete */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {activeDetail.search.status !== "fulfilled" ? (
                      <button
                        type="button"
                        onClick={() => onFulfill(activeDetail.search.id)}
                        className="px-3 py-1.5 text-[11px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/40 rounded-[2px] transition-colors cursor-pointer"
                        title="Mark inquiry as acquired / fulfilled"
                      >
                        ✓ Mark Fulfilled
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-slate-500/15 text-slate-300 border border-slate-500/30 rounded-[2px]">
                        Fulfilled
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(activeDetail.search.id)}
                      className="px-2.5 py-1.5 text-[11px] font-mono uppercase text-red-400/80 hover:text-red-300 hover:bg-red-950/20 rounded-[2px] transition-colors cursor-pointer"
                      title="Delete demand record"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Section B: Target Inquiry Specification Matrix */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                        Target Requirement:
                      </span>
                      <h4 className="font-serif text-2xl text-[var(--accent)] font-normal tracking-tight">
                        &ldquo;{activeDetail.search.queryTitle}&rdquo;
                      </h4>
                    </div>

                    {activeDetail.search.criteria.maxPrice && (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                          Budget Ceiling
                        </span>
                        <span className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-light tabular-nums">
                          LKR {activeDetail.search.criteria.maxPrice.toLocaleString("en-US")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Specification Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                    {activeDetail.search.criteria.make && activeDetail.search.criteria.make !== "all" && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)]">
                        Brand: <strong className="font-semibold">{activeDetail.search.criteria.make}</strong>
                      </span>
                    )}
                    {(activeDetail.search.criteria.model || activeDetail.search.criteria.keyword) && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)]">
                        Model: <strong className="font-semibold">{activeDetail.search.criteria.model || activeDetail.search.criteria.keyword}</strong>
                      </span>
                    )}
                    {(activeDetail.search.criteria.minYear || activeDetail.search.criteria.maxYear) && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                        Year: {activeDetail.search.criteria.minYear || "Any"} – {activeDetail.search.criteria.maxYear || "Present"}
                      </span>
                    )}
                    {activeDetail.search.criteria.bodyType && activeDetail.search.criteria.bodyType !== "all" && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                        Body: {activeDetail.search.criteria.bodyType.toUpperCase()}
                      </span>
                    )}
                    {activeDetail.search.criteria.fuel && activeDetail.search.criteria.fuel !== "all" && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                        Fuel: {activeDetail.search.criteria.fuel.toUpperCase()}
                      </span>
                    )}
                    {activeDetail.search.criteria.branch && activeDetail.search.criteria.branch !== "all" && (
                      <span className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)]">
                        Branch: {activeDetail.search.criteria.branch === "trincomalee" ? "Trincomalee" : "Kaduruwela"}
                      </span>
                    )}
                  </div>

                  {/* Customer Notes Quote */}
                  {activeDetail.search.notes && (
                    <div className="p-3.5 bg-[var(--bg-base)] border-l-2 border-[var(--accent)] text-xs text-[var(--text-secondary)] font-light italic rounded-r-[2px]">
                      &ldquo;{activeDetail.search.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Section C: Live Showroom Matching Studio */}
                <div className="pt-2 border-t border-[var(--border-hairline)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-2">
                      <span className="text-emerald-400">●</span>
                      <span>Showroom Cross-Reference &amp; Dispatch Studio</span>
                    </span>

                    {activeDetail.matches.length > 0 && (
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        ⚡ {activeDetail.matches.length} Chassis Available in Fleet
                      </span>
                    )}
                  </div>

                  {activeDetail.matches.length > 0 ? (
                    <div className="space-y-3">
                      {activeDetail.matches.map((v) => {
                        const isAlreadyNotified = activeDetail.search.matchedVehicleIds.includes(v.id);
                        const isSending = sendingAlertId === `${activeDetail.search.id}-${v.id}`;
                        const primaryImage = v.images[0] || "/images/vehicles/placeholder-coming-soon.png";

                        return (
                          <div
                            key={v.id}
                            className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--accent)]/40 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {/* Vehicle Thumbnail */}
                              <div className="w-24 shrink-0">
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
                                    {v.price ? `LKR ${v.price.toLocaleString("en-US")}` : "Call for Price"}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{v.mileage.toLocaleString()} KM</span>
                                  <span>&bull;</span>
                                  <span className="uppercase">{v.fuel}</span>
                                  <span>&bull;</span>
                                  <span className="capitalize">{v.branch || "Kaduruwela"}</span>
                                  {isAlreadyNotified && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                                        <span>✓</span>
                                        <span>Alert Previously Sent</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dispatch Trigger Button */}
                            <div className="flex items-center gap-2.5 shrink-0">
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
                                  setSendingAlertId(`${activeDetail.search.id}-${v.id}`);
                                  await onSendAlert(activeDetail.search.id, v.id);
                                  setSendingAlertId(null);
                                }}
                                className={`min-h-[40px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] cursor-pointer transition-all shadow-sm disabled:opacity-50 ${
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
                                    <span>{isAlreadyNotified ? "Re-send Alert" : "Send WhatsApp Alert"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Tokyo Auction Radar Box */
                    <div className="p-5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)] block">
                            Automated Japanese Auction Radar Active
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                            0 units currently in Kaduruwela/Trincomalee showroom stock. System actively monitors upcoming Tokyo auction allocations (USS Tokyo, TAA, ARAI) for this chassis specification.
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-secondary)] shrink-0">
                        <span>📡</span>
                        <span>Radar Active</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Section D: Notification Dispatch Log */}
                {activeDetail.search.notificationLog && activeDetail.search.notificationLog.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold block">
                      Dispatched Alert History ({activeDetail.search.notificationLog.length})
                    </span>
                    <div className="space-y-2">
                      {activeDetail.search.notificationLog.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[var(--text-primary)] font-medium block">
                              WhatsApp Dossier Sent: {log.vehicleTitle}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              Delivered on {new Date(log.notifiedAt).toLocaleString("en-LK")}
                            </span>
                          </div>
                          <Link
                            href={`/vehicles/${log.vehicleSlug}`}
                            target="_blank"
                            className="text-[var(--accent)] underline hover:no-underline text-[11px]"
                          >
                            View Vehicle ↗
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] text-xs text-[var(--text-secondary)]">
                Select a buyer from the queue to view target specifications and showroom matches.
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ============================================================
           MODE B: HIGH-DENSITY TABLE VIEW (WITH PAGINATION)
           ============================================================ */
        <div className="space-y-4">
          <div className="overflow-x-auto bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-base)] border-b border-[var(--border-hairline)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                <tr>
                  <th className="py-3 px-4 font-medium">Customer / Phone</th>
                  <th className="py-3 px-4 font-medium">Desired Vehicle Query</th>
                  <th className="py-3 px-4 font-medium">Target Budget</th>
                  <th className="py-3 px-4 font-medium">Showroom Match</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Registered</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {paginatedTableItems.map(({ search, matches }) => {
                  const hasMatches = matches.length > 0;
                  const waDirectUrl = buildWhatsAppUrl(
                    search.customerPhone,
                    `Hello ${search.customerName}, this is RS Enterprises Showroom regarding your vehicle inquiry.`
                  );

                  return (
                    <tr
                      key={search.id}
                      className="hover:bg-[var(--bg-base)] transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedSearchId(search.id);
                        setViewMode("split");
                        setShowMobileDetail(true);
                      }}
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-serif text-sm text-[var(--text-primary)] font-medium">
                          {search.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                          <span>{formatPhoneDisplay(search.customerPhone)}</span>
                          <a
                            href={waDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Direct WhatsApp"
                          >
                            ↗
                          </a>
                        </div>
                      </td>

                      {/* Query Title */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--accent)] font-medium">
                          &ldquo;{search.queryTitle}&rdquo;
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                          {search.criteria.make && search.criteria.make !== "all" && `${search.criteria.make} • `}
                          {search.criteria.minYear || 2018}–{search.criteria.maxYear || "Present"}
                          {search.criteria.bodyType && search.criteria.bodyType !== "all" && ` • ${search.criteria.bodyType}`}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-primary)]">
                        {search.criteria.maxPrice
                          ? `LKR ${search.criteria.maxPrice.toLocaleString("en-US")}`
                          : "Unspecified"}
                      </td>

                      {/* Matches */}
                      <td className="py-3.5 px-4">
                        {hasMatches ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                            <span>⚡</span>
                            <span>{matches.length} in Showroom</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-hairline)] rounded-full">
                            Radar Active
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            search.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                              : search.status === "notified"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {search.status === "active"
                            ? "Active"
                            : search.status === "notified"
                            ? "Alert Sent"
                            : "Fulfilled"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-[var(--text-muted)]">
                        {new Date(search.createdAt).toLocaleDateString("en-LK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSearchId(search.id);
                              setViewMode("split");
                              setShowMobileDetail(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-primary)] rounded-[2px]"
                          >
                            Inspect Dossier
                          </button>

                          {hasMatches && (
                            <button
                              type="button"
                              onClick={async () => {
                                const v = matches[0];
                                if (v) {
                                  await onSendAlert(search.id, v.id);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px]"
                              title="Send 1-click WhatsApp Alert for first matching vehicle"
                            >
                              Dispatch ⚡
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AdminPagination for Table */}
          <AdminPagination
            currentPage={tablePage}
            totalItems={filteredSearches.length}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={(sz) => {
              setTablePageSize(sz);
              setTablePage(1);
            }}
            pageSizeOptions={[10, 25, 50]}
            itemName="buyer demands"
          />
        </div>
      ) : (
        /* ============================================================
           MODE C: 2-COLUMN BALANCED CARD GRID (WITH PAGINATION)
           ============================================================ */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedGridItems.map(({ search, matches }) => {
              const hasMatches = matches.length > 0;
              const waDirectUrl = buildWhatsAppUrl(
                search.customerPhone,
                `Hello ${search.customerName}, this is RS Enterprises Showroom regarding your inquiry.`
              );

              return (
                <div
                  key={search.id}
                  className={`bg-[var(--bg-surface)] border rounded-[2px] p-5 space-y-4 transition-all ${
                    hasMatches && search.status === "active"
                      ? "border-[var(--accent)] shadow-[0_0_15px_rgba(212,175,55,0.08)]"
                      : "border-[var(--border-hairline)] hover:border-[var(--border-subtle)]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-hairline)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-lg text-[var(--text-primary)] font-medium">
                          {search.customerName}
                        </h4>
                        <a
                          href={waDirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-xs"
                          title="Direct WhatsApp"
                        >
                          ↗
                        </a>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {formatPhoneDisplay(search.customerPhone)}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                        search.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                          : search.status === "notified"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {search.status === "active"
                        ? "Active"
                        : search.status === "notified"
                        ? "Alert Sent"
                        : "Fulfilled"}
                    </span>
                  </div>

                  {/* Target Query & Budget */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                      Target Inquiry:
                    </span>
                    <div className="font-serif text-xl text-[var(--accent)] font-medium">
                      &ldquo;{search.queryTitle}&rdquo;
                    </div>
                    {search.criteria.maxPrice && (
                      <div className="text-xs font-mono text-[var(--text-primary)]">
                        Budget Ceiling: LKR {search.criteria.maxPrice.toLocaleString("en-US")}
                      </div>
                    )}
                  </div>

                  {/* Match Preview */}
                  <div className="pt-2 border-t border-[var(--border-hairline)]">
                    {hasMatches ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                          ⚡ {matches.length} Matching Unit{matches.length === 1 ? "" : "s"} in Stock
                        </span>
                        {/* Show first vehicle preview */}
                        {matches[0] && (
                          <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[var(--text-primary)] font-medium block">
                                {matches[0].year} {matches[0].make} {matches[0].model}
                              </span>
                              <span className="font-mono text-[var(--accent)] text-[11px]">
                                {matches[0].price ? `LKR ${matches[0].price.toLocaleString("en-US")}` : "Call"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onSendAlert(search.id, matches[0].id)}
                              className="px-3 py-1.5 text-[10px] font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] cursor-pointer"
                            >
                              Dispatch Alert
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span>Automated Tokyo Auction Radar Active</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSearchId(search.id);
                        setViewMode("split");
                        setShowMobileDetail(true);
                      }}
                      className="text-[var(--accent)] hover:underline"
                    >
                      Open Full Dossier →
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(search.id)}
                      className="text-red-400/80 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AdminPagination for Grid */}
          <AdminPagination
            currentPage={gridPage}
            totalItems={filteredSearches.length}
            pageSize={gridPageSize}
            onPageChange={setGridPage}
            onPageSizeChange={(sz) => {
              setGridPageSize(sz);
              setGridPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            itemName="buyer demands"
          />
        </div>
      )}

      {/* 5. ADD BUYER DEMAND / WISHLIST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] shadow-2xl p-6 sm:p-8 space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] block">
                  Showroom Walk-in / Telephone Request
                </span>
                <h3 className="font-serif text-2xl text-[var(--text-primary)] font-normal mt-0.5">
                  Record Buyer Demand Wishlist
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-[2px] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 text-xs rounded-[2px]">
                {modalError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleAddWishlistSubmit} className="space-y-4 text-left">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Buyer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Dr. Nalin Bandara"
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      WhatsApp / Phone (+94) *
                    </label>
                    <input
                      type="text"
                      required
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="077 123 4567 or +9477..."
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Manufacturer / Make
                    </label>
                    <select
                      value={addMake}
                      onChange={(e) => setAddMake(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] cursor-pointer"
                    >
                      <option value="all">Any Make</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Mitsubishi">Mitsubishi</option>
                      <option value="Nissan">Nissan</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Mercedes-Benz">Mercedes-Benz</option>
                      <option value="BMW">BMW</option>
                      <option value="Lexus">Lexus</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Model / Package Name
                    </label>
                    <input
                      type="text"
                      value={addModel}
                      onChange={(e) => setAddModel(e.target.value)}
                      placeholder="e.g. Land Cruiser Prado TX-L or Vezel"
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Max Budget (LKR)
                    </label>
                    <input
                      type="number"
                      value={addMaxPrice}
                      onChange={(e) => setAddMaxPrice(e.target.value)}
                      placeholder="e.g. 38500000"
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Preferred Branch
                    </label>
                    <select
                      value={addBranch}
                      onChange={(e) => setAddBranch(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] cursor-pointer"
                    >
                      <option value="all">Any Showroom</option>
                      <option value="polonnaruwa">Kaduruwela Main Showroom</option>
                      <option value="trincomalee">Trincomalee Branch</option>
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
                  onClick={handleCloseModal}
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
