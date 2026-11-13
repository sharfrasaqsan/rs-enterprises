"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { Lead } from "@/types/lead";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Numeral } from "@/components/ui/Numeral";

export function AdminDashboardClient({
  vehicles,
  leads,
}: {
  vehicles: Vehicle[];
  leads: Lead[];
}) {
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0] || "");
  }, []);

  // Calculations
  const activeLeads = leads.filter(
    (l) => l.stage !== "won" && l.stage !== "lost"
  );
  const newLeads = leads.filter((l) => l.stage === "new");

  const pendingFollowups = leads.filter(
    (l) => l.followUpDate && todayStr && l.followUpDate <= todayStr
  );

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const incomingVehicles = vehicles.filter((v) => v.status === "incoming");

  // Recent 6 leads
  const recentLeads = [...leads].slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Top Header Row with Clear Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Today&apos;s Operations</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Today Overview
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Kaduruwela Head Office &bull; Current live customer inquiries and vehicle status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/vehicles/new"
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            + Add New Vehicle
          </Link>
          <Link
            href="/admin/leads"
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
          >
            View Leads Pipeline
          </Link>
        </div>
      </div>

      {/* 4 High-Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
            Active Leads
          </span>
          <Numeral value={activeLeads.length} size="lg" />
          <span className="text-[11px] text-[var(--accent)] block">
            {newLeads.length} awaiting first response
          </span>
        </div>

        <div className="p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
            Follow-ups Due
          </span>
          <Numeral value={pendingFollowups.length} size="lg" />
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Scheduled for today or overdue
          </span>
        </div>

        <div className="p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
            Showroom Available
          </span>
          <Numeral value={availableVehicles.length} size="lg" />
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Ready on Kaduruwela floor
          </span>
        </div>

        <Link
          href="/admin/incoming"
          className="p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 hover:border-[var(--accent)] transition-colors block"
        >
          <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
            In-Transit / Pipeline &rarr;
          </span>
          <Numeral value={incomingVehicles.length} size="lg" />
          <span className="text-[11px] text-[var(--accent)] block">
            En route to Hambantota/Colombo
          </span>
        </Link>
      </div>

      {/* Recent Inquiries List with 1-Tap Call & WhatsApp Actions */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Inbound Interest</Eyebrow>
            <h2 className="font-serif text-2xl text-[var(--text-primary)] mt-0.5">
              Recent Customer Inquiries
            </h2>
          </div>
          <Link
            href="/admin/leads"
            className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
          >
            All Inquiries ({leads.length}) &rarr;
          </Link>
        </div>

        <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {recentLeads.map((lead) => {
            const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${encodeURIComponent(
              `Hello ${lead.name}, thank you for contacting RS Enterprises regarding ${lead.vehicleTitle || "our Japanese vehicle collection"}. How can we assist you today?`
            )}`;

            return (
              <div
                key={lead.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-base)]/50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-lg text-[var(--text-primary)] font-medium">
                      {lead.name}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] uppercase">
                      {lead.branch}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 uppercase bg-[var(--accent)]/15 text-[var(--accent)]">
                      Stage: {lead.stage}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] font-light truncate">
                    Interested in:{" "}
                    <strong className="text-[var(--text-primary)] font-medium">
                      {lead.vehicleTitle || "General Showroom Inquiry"}
                    </strong>
                  </p>

                  {lead.notes && lead.notes.length > 0 && (
                    <p className="text-[11px] text-[var(--text-secondary)] italic truncate max-w-xl">
                      &ldquo;{lead.notes[lead.notes.length - 1]?.text}&rdquo;
                    </p>
                  )}
                </div>

                {/* 1-Tap Actions: Call, WhatsApp, Open Dossier */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${lead.phone}`}
                    className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                  >
                    Call
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    WhatsApp
                  </a>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

