"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { Lead } from "@/types/lead";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function AdminDashboardClient({
  vehicles,
  leads,
}: {
  vehicles: Vehicle[];
  leads: Lead[];
}) {
  const [todayIso, setTodayIso] = useState<string>("");

  useEffect(() => {
    setTodayIso(new Date().toISOString().split("T")[0] || "");
  }, []);

  // Summary strip metrics
  const nowMs = Date.now();
  const oneWeekAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const leadsThisWeek = leads.filter(
    (l) => new Date(l.createdAt).getTime() >= oneWeekAgoMs
  ).length;

  const vehiclesAvailable = vehicles.filter(
    (v) => v.status === "available" && !v.archived
  ).length;

  const vehiclesIncoming = vehicles.filter(
    (v) => v.status === "incoming" && !v.archived
  ).length;

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
    const digits = phone.replace(/[^0-9]/g, "");
    const formatted = digits.startsWith("94")
      ? digits
      : digits.startsWith("0")
      ? "94" + digits.slice(1)
      : "94" + digits;
    const msg = `Hello ${name}, this is RS Enterprises Kaduruwela Showroom contacting you regarding ${
      vehicleTitle || "your Japanese vehicle inquiry"
    }. How may we assist you today?`;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
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
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-light">
            Interested in:{" "}
            <strong className="text-[var(--text-primary)] font-medium">
              {lead.vehicleTitle || "General Showroom Stock Inquiry"}
            </strong>
          </p>

          {contextSubtitle ? (
            <p className="text-[11px] font-mono text-amber-400/90 pt-0.5">
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

      {/* Small Summary Strip (No charts, pure utilitarian count blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
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
              Vehicles In Showroom
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              Available at Kaduruwela
            </span>
          </div>
          <span className="font-mono text-3xl font-semibold text-[var(--text-primary)]">
            {vehiclesAvailable}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
              Incoming From Japan
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-light mt-0.5 block">
              Auction &amp; high seas transit
            </span>
          </div>
          <span className="font-mono text-3xl font-semibold text-[var(--text-primary)]">
            {vehiclesIncoming}
          </span>
        </div>
      </div>

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
