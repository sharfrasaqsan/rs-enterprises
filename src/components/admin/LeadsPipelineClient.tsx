"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lead, LeadStage } from "@/types/lead";
import { updateLeadStageAction } from "@/app/actions/admin";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STAGES: { key: LeadStage | "all"; label: string }[] = [
  { key: "all", label: "All Inquiries" },
  { key: "new", label: "New (Uncontacted)" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing", label: "Showroom Viewing" },
  { key: "negotiating", label: "Negotiating" },
  { key: "won", label: "Won (Sold)" },
  { key: "lost", label: "Lost" },
];

export function LeadsPipelineClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedStage, setSelectedStage] = useState<LeadStage | "all">("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // In-Memory filtering for fast, low-read CRM
  const filteredLeads = leads.filter((l) => {
    if (selectedStage !== "all" && l.stage !== selectedStage) return false;
    if (selectedBranch !== "all" && l.branch !== selectedBranch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      const matchVehicle = l.vehicleTitle?.toLowerCase().includes(q) || false;
      if (!matchName && !matchPhone && !matchVehicle) return false;
    }
    return true;
  });

  async function handleAdvanceStage(leadId: string, currentStage: LeadStage) {
    let nextStage: LeadStage = "contacted";
    if (currentStage === "new") nextStage = "contacted";
    else if (currentStage === "contacted") nextStage = "viewing";
    else if (currentStage === "viewing") nextStage = "negotiating";
    else if (currentStage === "negotiating") nextStage = "won";

    setUpdatingId(leadId);
    const res = await updateLeadStageAction(leadId, nextStage);
    setUpdatingId(null);
    if (res.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Customer Pipeline</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Inquiries &amp; CRM
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Track lead status from initial website contact to showroom handover
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider">
            {filteredLeads.length} of {leads.length} inquiries
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Stage Filter Tabs (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STAGES.map((s) => {
            const count =
              s.key === "all"
                ? leads.length
                : leads.filter((l) => l.stage === s.key).length;
            const active = selectedStage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedStage(s.key)}
                className={`min-h-[44px] px-4 shrink-0 flex items-center gap-2 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]"
                }`}
              >
                <span>{s.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Branch Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone number, or vehicle model..."
              className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Branches</option>
              <option value="polonnaruwa">Kaduruwela Showroom</option>
              <option value="trincomalee">Trincomalee Branch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <p className="font-serif text-xl text-[var(--text-primary)]">
            No inquiries match your current filter
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Try switching the stage filter or clearing your search keywords.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedStage("all");
              setSelectedBranch("all");
              setSearchQuery("");
            }}
            className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] hover:underline pt-2 cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${encodeURIComponent(
              `Hello ${lead.name}, RS Enterprises Kaduruwela showroom calling regarding ${lead.vehicleTitle || "your Japanese vehicle request"}.`
            )}`;

            return (
              <div
                key={lead.id}
                className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-subtle)] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Information */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-lg text-[var(--text-primary)] font-medium">
                      {lead.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)]">
                      {lead.stage}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                      {lead.branch}
                    </span>
                    <span className="text-[10px] font-sans text-[var(--text-secondary)]">
                      Source: {lead.source.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-[var(--text-secondary)] font-light">
                      Vehicle:{" "}
                      <strong className="text-[var(--text-primary)] font-medium">
                        {lead.vehicleTitle || "General Showroom Inquiry"}
                      </strong>
                    </p>
                    <p className="font-mono text-[var(--text-secondary)]">
                      Tel: {lead.phone} {lead.email ? `• ${lead.email}` : ""}
                    </p>
                  </div>

                  {lead.notes && lead.notes.length > 0 && (
                    <p className="text-xs font-light text-[var(--text-secondary)] italic bg-[var(--bg-base)] p-2.5 rounded-[2px] border border-[var(--border-hairline)] line-clamp-2">
                      &ldquo;{lead.notes[lead.notes.length - 1]?.text}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--border-hairline)]">
                  {lead.stage !== "won" && lead.stage !== "lost" && (
                    <button
                      type="button"
                      disabled={updatingId === lead.id}
                      onClick={() => handleAdvanceStage(lead.id, lead.stage)}
                      className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {lead.stage === "new"
                        ? "Mark Contacted &rarr;"
                        : lead.stage === "contacted"
                        ? "Mark Viewing &rarr;"
                        : lead.stage === "viewing"
                        ? "Negotiating &rarr;"
                        : "Mark Won &rarr;"}
                    </button>
                  )}

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
                    Dossier &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

