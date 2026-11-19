"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SavedSearch, matchVehicleWithSavedSearch } from "@/types/saved-search";
import { Vehicle } from "@/types/vehicle";
import { formatPhoneDisplay, buildWhatsAppUrl } from "@/lib/phone";

interface SavedSearchesManagerProps {
  savedSearches: SavedSearch[];
  vehicles: Vehicle[];
  onSendAlert: (savedSearchId: string, vehicleId: string) => Promise<void>;
  onFulfill: (savedSearchId: string) => Promise<void>;
  onDelete: (savedSearchId: string) => Promise<void>;
}

export function SavedSearchesManager({
  savedSearches,
  vehicles,
  onSendAlert,
  onFulfill,
  onDelete,
}: SavedSearchesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  // Compute matches for each search
  const searchesWithMatches = savedSearches.map((search) => {
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

  // Filter searches
  const filtered = searchesWithMatches.filter(({ search }) => {
    if (statusFilter !== "all" && search.status !== statusFilter) return false;
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
  });

  const totalMatchesCount = searchesWithMatches.filter((s) => s.matches.length > 0).length;
  const activeAlertsCount = savedSearches.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
            Total Buyer Stock Alerts
          </span>
          <p className="font-serif text-2xl text-[var(--text-primary)] font-medium">
            {savedSearches.length}
          </p>
          <span className="text-[10px] text-[var(--text-secondary)] font-light">
            Visitors awaiting matching Japanese chassis
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Ready to Alert (Matches Available)
          </span>
          <p className="font-serif text-2xl text-[var(--accent)] font-medium">
            {totalMatchesCount}
          </p>
          <span className="text-[10px] text-[var(--text-secondary)] font-light">
            Buyers with matching stock in showroom
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-status-success font-semibold">
            Active Tokyo Auction Watch
          </span>
          <p className="font-serif text-2xl text-status-success font-medium">
            {activeAlertsCount}
          </p>
          <span className="text-[10px] text-[var(--text-secondary)] font-light">
            Auto-alerts queued for next auction arrival
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer name, phone, or vehicle model (e.g. Prado under 20M)..."
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-sans uppercase tracking-wider text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Monitoring</option>
            <option value="notified">Alert Sent</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      {/* Saved Searches Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-secondary)]">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.6">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p className="font-serif text-lg text-[var(--text-primary)]">
            No Back-in-Stock Alerts Found
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-light max-w-md mx-auto">
            Visitors save searches directly on the public inventory page (e.g. &ldquo;Prado under 20M&rdquo;) to receive WhatsApp alerts when matching cars land in our showroom.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ search, matches }) => {
            const hasMatches = matches.length > 0;
            const waInquiryUrl = buildWhatsAppUrl(
              search.customerPhone,
              `Hello ${search.customerName}, this is RS Enterprises Showroom regarding your saved search alert "${search.queryTitle}".`
            );

            return (
              <div
                key={search.id}
                className={`p-5 sm:p-6 bg-[var(--bg-surface)] border rounded-[2px] space-y-4 transition-colors ${
                  hasMatches && search.status === "active"
                    ? "border-amber-500/60 shadow-sm"
                    : "border-[var(--border-hairline)]"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-medium">
                        {search.customerName}
                      </h3>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {formatPhoneDisplay(search.customerPhone)}
                      </span>
                      <a
                        href={waInquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono uppercase px-2 py-0.5 badge-status-success font-semibold rounded-[1px] transition-colors"
                      >
                        Chat WhatsApp
                      </a>
                    </div>
                    {search.customerEmail && (
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {search.customerEmail}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[1px] border ${
                        search.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : search.status === "notified"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {search.status === "active"
                        ? "Active • Monitoring"
                        : search.status === "notified"
                        ? "Alert Sent"
                        : "Fulfilled"}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      Saved {new Date(search.createdAt).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Query Title & Criteria Badges */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔔</span>
                    <span className="font-serif text-lg text-[var(--accent)] font-medium">
                      &ldquo;{search.queryTitle}&rdquo;
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    {search.criteria.make && search.criteria.make !== "all" && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                        Make: {search.criteria.make}
                      </span>
                    )}
                    {(search.criteria.model || search.criteria.keyword) && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                        Model: {search.criteria.model || search.criteria.keyword}
                      </span>
                    )}
                    {search.criteria.maxPrice && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)] font-semibold">
                        Max: LKR {(search.criteria.maxPrice / 1000000).toFixed(0)}M
                      </span>
                    )}
                    {search.criteria.bodyType && search.criteria.bodyType !== "all" && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                        Body: {search.criteria.bodyType.toUpperCase()}
                      </span>
                    )}
                    {search.criteria.fuel && search.criteria.fuel !== "all" && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                        Fuel: {search.criteria.fuel.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {search.notes && (
                    <p className="text-xs text-[var(--text-secondary)] font-light italic">
                      Buyer Notes: &ldquo;{search.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Showroom Matching Vehicles Section */}
                <div className="pt-2">
                  {hasMatches ? (
                    <div className="p-4 badge-status-warning rounded-[2px] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase font-semibold text-status-warning flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>{matches.length} Matching Vehicle{matches.length === 1 ? "" : "s"} In Stock!</span>
                        </span>
                        <span className="text-[10px] font-mono text-status-warning opacity-90">
                          Ready for WhatsApp Dispatch
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {matches.map((v) => {
                          const isAlreadyNotified = search.matchedVehicleIds.includes(v.id);
                          const isSending = sendingAlertId === `${search.id}-${v.id}`;

                          return (
                            <div
                              key={v.id}
                              className="p-3 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <Link
                                  href={`/vehicles/${v.slug}`}
                                  target="_blank"
                                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors underline"
                                >
                                  {v.year} {v.make} {v.model} ({v.grade || "Standard"})
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                                  <span className="text-[var(--accent)] font-semibold">
                                    {v.price ? `LKR ${v.price.toLocaleString("en-US")}` : "Price on Call"}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{v.mileage.toLocaleString("en-US")} km</span>
                                  <span>&bull;</span>
                                  <span>{v.branch === "trincomalee" ? "Trincomalee" : "Kaduruwela Showroom"}</span>
                                  {isAlreadyNotified && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="text-status-success font-semibold">✓ Notified</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isSending}
                                onClick={async () => {
                                  setSendingAlertId(`${search.id}-${v.id}`);
                                  await onSendAlert(search.id, v.id);
                                  setSendingAlertId(null);
                                }}
                                className="min-h-[40px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
                              >
                                {isSending ? (
                                  <span>Preparing...</span>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                    <span>{isAlreadyNotified ? "Re-send WhatsApp Alert" : "Send WhatsApp Alert"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>0 matches in current stock. Automated Tokyo auction tracking active.</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        Next USS Tokyo Auction: Tomorrow
                      </span>
                    </div>
                  )}
                </div>

                {/* Notification Log History if available */}
                {search.notificationLog && search.notificationLog.length > 0 && (
                  <div className="pt-1 text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="text-[var(--accent)] font-semibold">Last Alert:</span>
                    <span>
                      {search.notificationLog[0]?.vehicleTitle} on {new Date(search.notificationLog[0]?.notifiedAt || "").toLocaleDateString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {search.status !== "fulfilled" ? (
                      <button
                        type="button"
                        onClick={() => onFulfill(search.id)}
                        className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-800 transition-colors cursor-pointer"
                      >
                        Mark as Fulfilled
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onFulfill(search.id)}
                        className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      >
                        Re-activate Alert
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(search.id)}
                    className="text-[10px] font-mono uppercase text-[var(--text-secondary)] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete Alert
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

