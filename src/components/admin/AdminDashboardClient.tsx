"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Vehicle, getHoldExpiryStatus } from "@/types/vehicle";
import { Lead } from "@/types/lead";
import {
  SavedSearch,
  matchVehicleWithSavedSearch,
  buildSavedSearchWhatsAppUrl,
} from "@/types/saved-search";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatPhoneDisplay, buildWhatsAppUrl } from "@/lib/phone";

export function AdminDashboardClient({
  vehicles,
  leads,
  savedSearches = [],
}: {
  vehicles: Vehicle[];
  leads: Lead[];
  savedSearches?: SavedSearch[];
}) {
  const [todayIso, setTodayIso] = useState<string>("");
  const [oneWeekAgoMs, setOneWeekAgoMs] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = Date.now();
      setTodayIso(new Date(now).toISOString().split("T")[0] || "");
      setOneWeekAgoMs(now - 7 * 24 * 60 * 60 * 1000);
      setNowMs(now);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Summary strip metrics
  const leadsThisWeek =
    oneWeekAgoMs > 0
      ? leads.filter((l) => new Date(l.createdAt).getTime() >= oneWeekAgoMs).length
      : leads.length;

  const vehiclesAvailable = vehicles.filter(
    (v) => v.status === "available" && !v.archived
  ).length;

  const vehiclesIncoming = vehicles.filter(
    (v) => v.status === "incoming" && !v.archived
  ).length;

  const vehiclesReserved = vehicles.filter(
    (v) => v.status === "reserved" && !v.archived
  ).length;

  // Active reservation holds & urgent expiry tracking
  const activeReservedVehicles = vehicles
    .filter((v) => v.status === "reserved" && !v.archived && v.reservation)
    .map((v) => ({
      vehicle: v,
      holdStatus: getHoldExpiryStatus(v.reservation?.holdExpiryDate),
    }));

  const urgentHolds = activeReservedVehicles.filter(
    (item) => item.holdStatus?.isExpired || item.holdStatus?.isExpiringSoon
  );

  // Active back-in-stock alerts that have matches in current inventory
  const alertsWithMatches = savedSearches
    .map((search) => {
      const matches = vehicles.filter(
        (v) =>
          v.published &&
          v.status !== "sold" &&
          !v.archived &&
          matchVehicleWithSavedSearch(v, search)
      );
      return { search, matches };
    })
    .filter((item) => item.matches.length > 0 && item.search.status === "active");

  // 1. New enquiries (not yet contacted)
  const newEnquiries = leads.filter((l) => l.stage === "new");

  // 2. Follow-ups due today and overdue
  const followUpsDue = leads.filter((l) => {
    if (!l.followUpDate || !todayIso) return false;
    if (l.stage === "won" || l.stage === "lost") return false;
    const fDate = l.followUpDate.split("T")[0];
    return fDate ? fDate <= todayIso : false;
  });

  // 3. Hot leads (viewing or negotiating)
  const hotLeads = leads.filter(
    (l) => l.stage === "viewing" || l.stage === "negotiating"
  );

  function formatTimeAgo(dateStr: string): string {
    try {
      const diffMs = nowMs - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} wk${diffWeeks === 1 ? "" : "s"} ago`;
    } catch {
      return dateStr;
    }
  }

  function getWhatsAppUrl(phone: string, name: string, vehicleTitle?: string | null): string {
    const msg = `Hello ${name}, this is RS Enterprises Kaduruwela Showroom contacting you regarding ${
      vehicleTitle || "your Japanese vehicle inquiry"
    }. How may we assist you today?`;
    return buildWhatsAppUrl(phone, msg);
  }

  function renderLeadRow(lead: Lead, contextSubtitle?: string) {
    const timeAgo = formatTimeAgo(lead.createdAt);
    const waUrl = getWhatsAppUrl(lead.phone, lead.name, lead.vehicleTitle);

    return (
      <div
        key={lead.id}
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--bg-base)]/40 transition-colors"
      >
        {/* Customer & Vehicle Info */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-medium">
              {lead.name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] uppercase">
              {lead.branch === "polonnaruwa" ? "Kaduruwela" : "Trincomalee"}
            </span>
            <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
              {timeAgo}
            </span>
            {(lead.isReturningBuyer || (lead.inquiryCount && lead.inquiryCount > 1)) && (
              <span className="px-2 py-0.5 badge-status-warning text-[9px] font-mono uppercase font-semibold rounded-[1px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{lead.inquiryCount || 2}x Merged</span>
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-light">
            <span className="font-mono text-[var(--text-secondary)]">{formatPhoneDisplay(lead.phone)}</span> &bull; Interested in:{" "}
            <strong className="text-[var(--text-primary)] font-medium">
              {lead.vehicleTitle || "General Showroom Stock Inquiry"}
            </strong>
          </p>

          {contextSubtitle ? (
            <p className="text-[11px] font-mono text-status-warning pt-0.5 font-medium">
              &bull; {contextSubtitle}
            </p>
          ) : lead.requestDetails ? (
            <p className="text-[11px] text-[var(--text-secondary)] italic truncate max-w-2xl pt-0.5">
              &ldquo;{lead.requestDetails}&rdquo;
            </p>
          ) : null}
        </div>

        {/* Big Action Buttons: Call & WhatsApp */}
        <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-hairline)]">
          <a
            href={`tel:${lead.phone}`}
            className="min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors rounded-[2px]"
            title={`Call ${lead.name}`}
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <span>Call</span>
          </a>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] shadow-sm"
            title={`WhatsApp ${lead.name}`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>WhatsApp</span>
          </a>

          <Link
            href={`/admin/leads?lead=${lead.id}`}
            className="min-h-[44px] px-3.5 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors rounded-[2px]"
          >
            Open &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Showroom Daily Dashboard</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Today
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Kaduruwela &bull; One obvious next action for every customer enquiry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/leads?action=new"
            className="min-h-[44px] px-5 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm rounded-[2px]"
          >
            + Add Enquiry
          </Link>
          <Link
            href="/admin/leads"
            className="min-h-[44px] px-5 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors rounded-[2px]"
          >
            All Leads Board
          </Link>
        </div>
      </div>

      {/* Small Summary Strip (Pure utilitarian count blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
              Enquiries This Week
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              Inbound customer interest
            </span>
          </div>
          <span className="font-mono text-3xl font-semibold text-[var(--accent)]">
            {leadsThisWeek}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
              Available Fleet
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              In showroom stock
            </span>
          </div>
          <span className="font-mono text-3xl font-semibold text-[var(--text-primary)]">
            {vehiclesAvailable}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
              Reserved &amp; On Hold
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              {urgentHolds.length > 0 ? (
                <span className="text-amber-400 font-medium">⚠️ {urgentHolds.length} hold alert{urgentHolds.length === 1 ? "" : "s"}</span>
              ) : (
                "With customer deposit"
              )}
            </span>
          </div>
          <span className={`font-mono text-3xl font-semibold ${urgentHolds.length > 0 ? "text-amber-400" : "text-[var(--text-primary)]"}`}>
            {vehiclesReserved}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
              Incoming From Japan
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              Auction &amp; sea transit
            </span>
          </div>
          <span className="font-mono text-3xl font-semibold text-[var(--text-primary)]">
            {vehiclesIncoming}
          </span>
        </div>
      </div>

      {/* Urgent Attention: Vehicle Hold Expiry Alerts */}
      {urgentHolds.length > 0 && (
        <section className="space-y-3 p-5 badge-status-warning rounded-[2px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--status-warning-border)]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚠️</span>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-medium">
                  Vehicle Hold Expiry Alerts ({urgentHolds.length})
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-light">
                  Deposit hold duration has elapsed or expires today. Contact buyer or release hold back to showroom stock.
                </p>
              </div>
            </div>
            <Link
              href="/admin/vehicles?status=reserved"
              className="px-4 py-2 text-xs font-sans uppercase font-medium tracking-wider badge-status-warning hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              Open Inventory &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {urgentHolds.map(({ vehicle, holdStatus }) => {
              const res = vehicle.reservation!;
              const buyerWa = res.customerPhone
                ? buildWhatsAppUrl(
                    res.customerPhone,
                    `Hello ${res.customerName || "Customer"}, this is RS Enterprises regarding your deposit hold on the ${vehicle.year} ${vehicle.make} ${vehicle.model}. The hold period is expiring. Could you kindly advise on the paperwork settlement?`
                  )
                : null;

              return (
                <div
                  key={vehicle.id}
                  className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-lg text-[var(--text-primary)] font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                        Deposit: LKR {res.depositAmount.toLocaleString("en-US")}
                      </p>
                    </div>
                    {holdStatus && (
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded-[1px] ${holdStatus.badgeClass}`}>
                        {holdStatus.label}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                    <p>
                      Buyer: <strong className="text-[var(--text-primary)]">{res.customerName || "Unknown Customer"}</strong>
                      {res.customerPhone && (
                        <span className="font-mono ml-1 text-[var(--text-secondary)]">
                          ({formatPhoneDisplay(res.customerPhone)})
                        </span>
                      )}
                    </p>
                    {res.notes && (
                      <p className="italic text-[11px] font-light truncate">
                        &ldquo;{res.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--border-hairline)]">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      Expiry: {new Date(res.holdExpiryDate).toLocaleDateString("en-LK")}
                    </span>

                    <div className="flex items-center gap-2">
                      {buyerWa && (
                        <a
                          href={buyerWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[10px] font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[1px]"
                        >
                          WhatsApp Buyer
                        </a>
                      )}
                      <Link
                        href={`/admin/vehicles/${vehicle.id}/edit`}
                        className="px-2.5 py-1 text-[10px] font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors rounded-[1px]"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Back-in-Stock Match Alerts (Waiting Buyers) */}
      {alertsWithMatches.length > 0 && (
        <section className="space-y-3 p-5 bg-[var(--bg-surface)] border border-amber-500/50 rounded-[2px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔔</span>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-medium">
                  Back-in-Stock Match Alerts ({alertsWithMatches.length} Buyers Waiting)
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-light">
                  Visitors saved searches that currently match available showroom stock. 1-click dispatch prepared for WhatsApp.
                </p>
              </div>
            </div>
            <Link
              href="/admin/leads"
              className="px-4 py-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto rounded-[2px]"
            >
              Manage Saved Searches &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {alertsWithMatches.map(({ search, matches }) => {
              const firstMatch = matches[0]!;
              const waUrl = buildSavedSearchWhatsAppUrl(search, firstMatch);

              return (
                <div
                  key={search.id}
                  className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base text-[var(--text-primary)] font-medium">
                        {search.customerName}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 badge-status-warning font-semibold">
                        &ldquo;{search.queryTitle}&rdquo;
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[var(--text-secondary)]">
                      Tel: {formatPhoneDisplay(search.customerPhone)}
                    </p>
                    <p className="text-xs text-status-success font-semibold">
                      Matched: {firstMatch.year} {firstMatch.make} {firstMatch.model} ({firstMatch.price ? `LKR ${firstMatch.price.toLocaleString("en-US")}` : "Price on Call"})
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[38px] px-3 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px]"
                    >
                      <span>📱 Send WhatsApp Stock Alert</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 1: New enquiries (not yet contacted) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[var(--accent)]">
              {newEnquiries.length}
            </span>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              New Enquiries
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Customers waiting for first contact. Call or WhatsApp them first.
          </p>
        </div>

        {newEnquiries.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1">
            <p className="font-serif text-base text-[var(--text-primary)]">
              No new uncontacted enquiries
            </p>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              You are all caught up. All new inquiries have been contacted.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {newEnquiries.map((lead) => renderLeadRow(lead))}
          </div>
        )}
      </section>

      {/* Section 2: Follow-ups due today and overdue */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-baseline gap-3">
            <span
              className={`font-mono text-2xl sm:text-3xl font-bold ${
                followUpsDue.length > 0 ? "text-amber-400" : "text-[var(--text-secondary)]"
              }`}
            >
              {followUpsDue.length}
            </span>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              Follow-ups Due Today &amp; Overdue
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Customer callbacks and viewings you scheduled for today or earlier.
          </p>
        </div>

        {followUpsDue.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1">
            <p className="font-serif text-base text-[var(--text-primary)]">
              No follow-ups due today
            </p>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Great job! All scheduled customer follow-ups for today are complete.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {followUpsDue.map((lead) => {
              const fDate = lead.followUpDate?.split("T")[0];
              const isOverdue = fDate && todayIso && fDate < todayIso;
              return renderLeadRow(
                lead,
                isOverdue
                  ? `Overdue callback (promised on ${fDate})`
                  : `Callback promised for today`
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Hot leads (viewing or negotiating) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {hotLeads.length}
            </span>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              Hot Leads (Viewing &amp; Negotiating)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Customers actively inspecting vehicles or negotiating final purchase terms.
          </p>
        </div>

        {hotLeads.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1">
            <p className="font-serif text-base text-[var(--text-primary)]">
              No active viewing or negotiating leads
            </p>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Follow up with contacted leads to schedule test drives and showroom visits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {hotLeads.map((lead) =>
              renderLeadRow(
                lead,
                lead.stage === "viewing"
                  ? "Showroom inspection / test drive in progress"
                  : "Price negotiation / financing terms in progress"
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
