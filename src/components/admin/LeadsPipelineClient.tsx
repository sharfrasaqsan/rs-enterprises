"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lead, LeadStage, LeadSource, DealershipBranch } from "@/types/lead";
import { Vehicle } from "@/types/vehicle";
import {
  updateLeadStageAction,
  addLeadNoteAction,
  setLeadFollowUpAction,
  createLeadAdminAction,
  markLeadWonWithVehicleAction,
  reassignLeadAction,
  deleteLeadAction,
} from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  exportLeadsToPDF,
  exportSingleLeadToPDF,
} from "@/lib/export-leads";

const BOARD_COLUMNS: { key: "new" | "contacted" | "viewing" | "negotiating" | "closed"; label: string }[] = [
  { key: "new", label: "New Enquiries" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing", label: "Viewing / Test Drive" },
  { key: "negotiating", label: "Negotiating" },
  { key: "closed", label: "Closed (Won / Lost)" },
];

export function LeadsPipelineClient({
  initialLeads,
  vehicles = [],
}: {
  initialLeads: Lead[];
  vehicles?: Vehicle[];
}) {
  const { user } = useAdminAuth();
  const searchParams = useSearchParams();
  const isOwner = user?.role === "owner";

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedMobileStage, setSelectedMobileStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStaff, setFilterStaff] = useState<string>("all");

  // Selected Lead for Slide-over
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  // Add Lead Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addVehicleTitle, setAddVehicleTitle] = useState("");
  const [addSource, setAddSource] = useState<LeadSource>("phone");
  const [addBranch, setAddBranch] = useState<DealershipBranch>("polonnaruwa");
  const [addNote, setAddNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Mark Won Modal State
  const [wonLeadTarget, setWonLeadTarget] = useState<Lead | null>(null);

  // Mark Lost Modal State
  const [lostLeadTarget, setLostLeadTarget] = useState<Lead | null>(null);
  const [lostReasonChoice, setLostReasonChoice] = useState("Price too high / budget mismatch");
  const [lostReasonCustom, setLostReasonCustom] = useState("");

  // Delete Lead Confirmation Modal (Owner Only)
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<Lead | null>(null);

  // Slide-over note input
  const [slideNoteText, setSlideNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Drag and drop tracking
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check URL query param for default opened lead or add action
  useEffect(() => {
    const qLead = searchParams.get("lead");
    if (qLead) {
      setActiveLeadId(qLead);
    }
    const qAction = searchParams.get("action");
    if (qAction === "new") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Derived active lead
  const activeLead = leads.find((l) => l.id === activeLeadId) || null;

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (filterBranch !== "all" && l.branch !== filterBranch) return false;
    if (filterSource !== "all" && l.source !== filterSource) return false;
    if (filterStaff !== "all") {
      if (filterStaff === "unassigned" && l.assignedTo) return false;
      if (filterStaff !== "unassigned" && l.assignedTo !== filterStaff) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      const matchVehicle = l.vehicleTitle?.toLowerCase().includes(q) || false;
      if (!matchName && !matchPhone && !matchVehicle) return false;
    }
    return true;
  });

  // Unique staff list for filter
  const staffList = Array.from(
    new Set(leads.map((l) => l.assignedTo).filter(Boolean) as string[])
  );

  // Helpers for formatting
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

  function formatRelativeTime(dateStr: string): string {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString("en-LK", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  }

  // Stage change logic (Optimistic UI)
  async function handleStageChange(leadId: string, targetStage: LeadStage) {
    if (targetStage === "won") {
      const target = leads.find((l) => l.id === leadId);
      if (target) {
        setWonLeadTarget(target);
        return;
      }
    }
    if (targetStage === "lost") {
      const target = leads.find((l) => l.id === leadId);
      if (target) {
        setLostLeadTarget(target);
        return;
      }
    }

    // Optimistic update
    const previousLeads = [...leads];
    const author = user?.displayName || "Showroom Staff";
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage, updatedBy: author } : l))
    );

    const res = await updateLeadStageAction(leadId, targetStage, undefined, author);
    if (!res.success) {
      setLeads(previousLeads);
      alert(res.error || "Failed to update lead stage.");
    }
  }

  // Confirm Mark Won
  async function handleConfirmWon(markVehicleSold: boolean) {
    if (!wonLeadTarget) return;
    const author = user?.displayName || "Showroom Staff";
    const leadId = wonLeadTarget.id;
    const vehicleId = wonLeadTarget.vehicleId;

    // Optimistic
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: "won", updatedBy: author } : l))
    );
    setWonLeadTarget(null);

    const res = await markLeadWonWithVehicleAction(leadId, markVehicleSold, vehicleId, author);
    if (!res.success) {
      alert(res.error || "Failed to complete sale.");
    }
  }

  // Confirm Mark Lost
  async function handleConfirmLost() {
    if (!lostLeadTarget) return;
    const author = user?.displayName || "Showroom Staff";
    const leadId = lostLeadTarget.id;
    const reason =
      lostReasonChoice === "Other"
        ? lostReasonCustom.trim() || "Other"
        : lostReasonChoice;

    // Optimistic
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, stage: "lost", lostReason: reason, updatedBy: author } : l
      )
    );
    setLostLeadTarget(null);
    setLostReasonCustom("");

    const res = await updateLeadStageAction(leadId, "lost", reason, author);
    if (!res.success) {
      alert(res.error || "Failed to mark lead as lost.");
    }
  }

  // Drag & drop handlers
  function handleDragStart(leadId: string) {
    setDraggedLeadId(leadId);
  }

  function handleDrop(targetColumn: "new" | "contacted" | "viewing" | "negotiating" | "closed") {
    if (!draggedLeadId) return;
    if (targetColumn === "closed") {
      const target = leads.find((l) => l.id === draggedLeadId);
      if (target) {
        setWonLeadTarget(target);
      }
    } else {
      handleStageChange(draggedLeadId, targetColumn);
    }
    setDraggedLeadId(null);
  }

  // Add Lead Submit
  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addPhone.trim()) return;

    setIsAdding(true);
    const author = user?.displayName || "Showroom Staff";
    const res = await createLeadAdminAction(
      {
        name: addName.trim(),
        phone: addPhone.trim(),
        vehicleTitle: addVehicleTitle.trim() || undefined,
        source: addSource,
        branch: addBranch,
        note: addNote.trim() || undefined,
        assignedTo: user?.displayName || "Staff",
      },
      author
    );
    setIsAdding(false);

    if (res.success && res.leadId) {
      const newLeadObj: Lead = {
        id: res.leadId,
        name: addName.trim(),
        phone: addPhone.trim(),
        email: null,
        source: addSource,
        branch: addBranch,
        vehicleId: null,
        vehicleTitle: addVehicleTitle.trim() || null,
        requestDetails: addNote.trim() || null,
        stage: "new",
        assignedTo: user?.displayName || "Staff",
        followUpDate: null,
        lostReason: null,
        updatedBy: author,
        notes: addNote.trim()
          ? [
              {
                id: `note-${Date.now()}`,
                text: addNote.trim(),
                author,
                time: new Date().toISOString(),
              },
            ]
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLeads((prev) => [newLeadObj, ...prev]);
      setShowAddModal(false);
      setAddName("");
      setAddPhone("");
      setAddVehicleTitle("");
      setAddNote("");
      setActiveLeadId(res.leadId);
    } else {
      alert(res.error || "Failed to create lead.");
    }
  }

  // Slide-over add note
  async function handleAddSlideNote(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLead || !slideNoteText.trim()) return;

    setIsSubmittingNote(true);
    const author = user?.displayName || "Showroom Staff";
    const text = slideNoteText.trim();
    const res = await addLeadNoteAction(activeLead.id, text, author);
    setIsSubmittingNote(false);

    if (res.success) {
      const newNote = {
        id: `note-${Date.now()}`,
        text,
        author,
        time: new Date().toISOString(),
      };
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeLead.id
            ? { ...l, notes: [...l.notes, newNote], updatedAt: new Date().toISOString() }
            : l
        )
      );
      setSlideNoteText("");
    }
  }

  // Quick Follow-up setter
  async function handleSetQuickFollowUp(leadId: string, daysToAdd: number | null) {
    let dateStr: string | null = null;
    if (daysToAdd !== null) {
      const target = new Date();
      target.setDate(target.getDate() + daysToAdd);
      dateStr = target.toISOString().split("T")[0] || null;
    }

    const author = user?.displayName || "Showroom Staff";
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, followUpDate: dateStr, updatedBy: author } : l))
    );

    await setLeadFollowUpAction(leadId, dateStr, author);
  }

  // Reassign Lead (Owner Only)
  async function handleReassign(leadId: string, newStaff: string) {
    const author = user?.displayName || "Showroom Director";
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, assignedTo: newStaff, updatedBy: author } : l))
    );
    await reassignLeadAction(leadId, newStaff, author);
  }

  // Delete Lead (Owner Only)
  async function handleConfirmDelete() {
    if (!deleteLeadTarget) return;
    const leadId = deleteLeadTarget.id;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (activeLeadId === leadId) setActiveLeadId(null);
    setDeleteLeadTarget(null);

    await deleteLeadAction(leadId);
  }

  // Find linked vehicle
  const linkedVehicle = activeLead?.vehicleId
    ? vehicles.find((v) => v.id === activeLead.vehicleId || v.slug === activeLead.vehicleId)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Customer Enquiries &amp; Pipeline</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Leads
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Manage incoming inquiries, schedule viewings, and log customer conversations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Export PDF Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => {
                if (filteredLeads.length === leads.length) {
                  exportLeadsToPDF(leads, {
                    filterSummary: `All Showroom Enquiries (${leads.length} Records)`,
                  });
                } else {
                  setShowExportMenu((prev) => !prev);
                }
              }}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px] cursor-pointer shadow-sm"
              aria-label="Export leads to PDF report"
            >
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Export PDF</span>
              {filteredLeads.length !== leads.length && (
                <svg className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {showExportMenu && filteredLeads.length !== leads.length && (
              <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl z-30 rounded-[2px] p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">PDF Scope</div>
                  <div className="text-xs font-medium text-[var(--text-primary)] mt-0.5">
                    Filter Active: {filteredLeads.length} of {leads.length} Leads
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      exportLeadsToPDF(filteredLeads, {
                        filterSummary: `Filtered View (${filteredLeads.length} of ${leads.length} Records)`,
                      });
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-[2px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                        <span>Filtered View</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {filteredLeads.length} leads matching filter
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportLeadsToPDF(leads, {
                        filterSummary: `Complete Showroom Dossier (${leads.length} Total Records)`,
                      });
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-[2px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                        <span>All Leads Dossier</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {leads.length} total showroom records
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm rounded-[2px] cursor-pointer"
          >
            + Add Lead (Phone / Walk-in)
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, or vehicle..."
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Branches</option>
            <option value="polonnaruwa">Kaduruwela</option>
            <option value="trincomalee">Trincomalee</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Channels</option>
            <option value="website_form">Website Contact Form</option>
            <option value="vehicle_request">Vehicle Request</option>
            <option value="whatsapp">Direct WhatsApp</option>
            <option value="phone">Direct Phone Call</option>
            <option value="walk_in">Showroom Walk-in</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Staff</option>
            {staffList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* MOBILE: Stage Filter Chips */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedMobileStage("all")}
          className={`min-h-[44px] px-4 shrink-0 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] border ${
            selectedMobileStage === "all"
              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
          }`}
        >
          All ({filteredLeads.length})
        </button>
        {BOARD_COLUMNS.map((col) => {
          const count =
            col.key === "closed"
              ? filteredLeads.filter((l) => l.stage === "won" || l.stage === "lost").length
              : filteredLeads.filter((l) => l.stage === col.key).length;
          return (
            <button
              key={col.key}
              type="button"
              onClick={() => setSelectedMobileStage(col.key)}
              className={`min-h-[44px] px-4 shrink-0 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] border ${
                selectedMobileStage === col.key
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
              }`}
            >
              {col.label} ({count})
            </button>
          );
        })}
      </div>

      {/* DESKTOP 5-COLUMN BOARD */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-start">
        {BOARD_COLUMNS.map((col) => {
          const colLeads =
            col.key === "closed"
              ? filteredLeads.filter((l) => l.stage === "won" || l.stage === "lost")
              : filteredLeads.filter((l) => l.stage === col.key);

          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              className="bg-[var(--bg-surface)]/60 border border-[var(--border-hairline)] p-3 rounded-[2px] min-h-[600px] flex flex-col space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                <span className="font-sans text-[11px] uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  {col.label}
                </span>
                <span className="font-mono text-xs text-[var(--accent)] font-semibold">
                  {colLeads.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="space-y-3 flex-1">
                {colLeads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-secondary)] font-light italic">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const waUrl = getWhatsAppUrl(lead.phone, lead.name, lead.vehicleTitle);
                    const isClosed = lead.stage === "won" || lead.stage === "lost";

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => setActiveLeadId(lead.id)}
                        className={`p-3.5 bg-[var(--bg-surface)] border rounded-[2px] transition-all cursor-pointer space-y-2 hover:border-[var(--accent)] ${
                          activeLeadId === lead.id
                            ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                            : "border-[var(--border-hairline)] shadow-sm"
                        }`}
                      >
                        {/* Name & Channel */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif text-base text-[var(--text-primary)] font-medium leading-snug">
                            {lead.name}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--text-secondary)] shrink-0">
                            {formatRelativeTime(lead.createdAt)}
                          </span>
                        </div>

                        {/* Vehicle of Interest */}
                        <p className="text-xs text-[var(--text-secondary)] font-light line-clamp-1">
                          {lead.vehicleTitle || "General Showroom Inquiry"}
                        </p>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                          <span className="px-1.5 py-0.2 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] uppercase">
                            {lead.branch === "polonnaruwa" ? "Kadu" : "Trinco"}
                          </span>

                          {isClosed ? (
                            <span
                              className={`px-1.5 py-0.2 uppercase rounded-[1px] ${
                                lead.stage === "won"
                                  ? "bg-green-950/30 text-green-400 border border-green-800"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                              }`}
                            >
                              {lead.stage === "won" ? "Won (Sold)" : "Lost"}
                            </span>
                          ) : lead.followUpDate ? (
                            <span className="px-1.5 py-0.2 bg-amber-950/20 text-amber-300 border border-amber-800">
                              Due: {lead.followUpDate.split("T")[0]}
                            </span>
                          ) : null}
                        </div>

                        {/* Bottom Actions: Call, WhatsApp, Stage Advance Button */}
                        <div
                          className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${lead.phone}`}
                              className="min-h-[32px] px-2 inline-flex items-center text-[10px] uppercase font-sans tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] rounded-[1px]"
                              title="Call"
                            >
                              Call
                            </a>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[32px] px-2 inline-flex items-center text-[10px] uppercase font-sans tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[1px]"
                              title="WhatsApp"
                            >
                              WA
                            </a>
                          </div>

                          {/* Fallback stage move button */}
                          {!isClosed && (
                            <select
                              value={lead.stage}
                              onChange={(e) =>
                                handleStageChange(lead.id, e.target.value as LeadStage)
                              }
                              className="h-8 px-1.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] rounded-[1px] focus:outline-none"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="viewing">Viewing</option>
                              <option value="negotiating">Negotiate</option>
                              <option value="won">Won</option>
                              <option value="lost">Lost</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE CARD LIST */}
      <div className="lg:hidden space-y-3">
        {(() => {
          const mobileLeads =
            selectedMobileStage === "all"
              ? filteredLeads
              : selectedMobileStage === "closed"
              ? filteredLeads.filter((l) => l.stage === "won" || l.stage === "lost")
              : filteredLeads.filter((l) => l.stage === selectedMobileStage);

          if (mobileLeads.length === 0) {
            return (
              <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
                <p className="font-serif text-lg text-[var(--text-primary)]">
                  No inquiries match this filter
                </p>
                <p className="text-xs text-[var(--text-secondary)] font-light">
                  Try switching the stage chip or clearing search keywords.
                </p>
              </div>
            );
          }

          return mobileLeads.map((lead) => {
            const waUrl = getWhatsAppUrl(lead.phone, lead.name, lead.vehicleTitle);
            return (
              <div
                key={lead.id}
                onClick={() => setActiveLeadId(lead.id)}
                className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 rounded-[2px]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-serif text-lg text-[var(--text-primary)] font-medium block">
                      {lead.name}
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                      {lead.vehicleTitle || "General Showroom Inquiry"}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                    {formatRelativeTime(lead.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                  <span className="px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                    {lead.stage}
                  </span>
                  <span className="px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                    {lead.branch}
                  </span>
                </div>

                <div
                  className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="min-h-[44px] px-4 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    >
                      Call
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white"
                    >
                      WhatsApp
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveLeadId(lead.id)}
                    className="min-h-[44px] px-3 text-xs uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Details &rarr;
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* SLIDE-OVER LEAD DOSSIER PANEL */}
      {activeLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveLeadId(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border-l border-[var(--border-hairline)] h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl z-10">
            {/* Close button & Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border-hairline)]">
              <div>
                <Eyebrow>Lead Dossier</Eyebrow>
                <Heading level={2} className="text-2xl sm:text-3xl mt-0.5">
                  {activeLead.name}
                </Heading>
                <p className="font-mono text-xs text-[var(--text-secondary)] mt-0.5">
                  Tel: {activeLead.phone} {activeLead.email ? `• ${activeLead.email}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveLeadId(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>

            {/* Big Action Buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${activeLead.phone}`}
                  className="min-h-[48px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors rounded-[2px]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  <span>Direct Call</span>
                </a>

                <a
                  href={getWhatsAppUrl(activeLead.phone, activeLead.name, activeLead.vehicleTitle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>WhatsApp (+94)</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => exportSingleLeadToPDF(activeLead)}
                className="w-full min-h-[42px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-base)] transition-colors rounded-[2px] cursor-pointer"
                title="Print or export individual client profile sheet as PDF"
              >
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print / Export Lead Dossier (.PDF)</span>
              </button>
            </div>

            {/* Stage Selector with Quick 1-Tap Buttons */}
            <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                Current Enquiry Stage:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["new", "contacted", "viewing", "negotiating", "won", "lost"] as LeadStage[]).map(
                  (stg) => {
                    const active = activeLead.stage === stg;
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => handleStageChange(activeLead.id, stg)}
                        className={`min-h-[40px] px-2 text-[10px] font-sans uppercase font-medium tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                          active
                            ? stg === "won"
                              ? "bg-green-800 text-white border-green-700"
                              : stg === "lost"
                              ? "bg-neutral-700 text-white border-neutral-600"
                              : "bg-[var(--accent)] text-white border-[var(--accent)]"
                            : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {stg === "new"
                          ? "New"
                          : stg === "contacted"
                          ? "Contacted"
                          : stg === "viewing"
                          ? "Viewing"
                          : stg === "negotiating"
                          ? "Negotiate"
                          : stg === "won"
                          ? "Won (Sold)"
                          : "Lost"}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Follow-up Date with Quick Choices */}
            <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                  Scheduled Follow-up Date:
                </span>
                {activeLead.followUpDate && (
                  <button
                    type="button"
                    onClick={() => handleSetQuickFollowUp(activeLead.id, null)}
                    className="text-[10px] font-mono text-red-400 hover:underline uppercase"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              {/* Quick Choice Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(activeLead.id, 1)}
                  className="min-h-[38px] px-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(activeLead.id, 3)}
                  className="min-h-[38px] px-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(activeLead.id, 7)}
                  className="min-h-[38px] px-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
                >
                  Next Week
                </button>
              </div>

              {/* Custom Date Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">Custom:</span>
                <input
                  type="date"
                  value={activeLead.followUpDate ? activeLead.followUpDate.split("T")[0] : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const author = user?.displayName || "Showroom Staff";
                    setLeads((prev) =>
                      prev.map((l) =>
                        l.id === activeLead.id ? { ...l, followUpDate: val || null, updatedBy: author } : l
                      )
                    );
                    setLeadFollowUpAction(activeLead.id, val || null, author);
                  }}
                  className="h-9 px-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] font-mono flex-1"
                />
              </div>
            </div>

            {/* Vehicle of Interest Card */}
            <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold block">
                Vehicle of Interest:
              </span>
              <p className="font-serif text-lg text-[var(--text-primary)]">
                {activeLead.vehicleTitle || "General Showroom Inquiry"}
              </p>

              {linkedVehicle && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    {linkedVehicle.price
                      ? `LKR ${linkedVehicle.price.toLocaleString("en-US")}`
                      : "Price on Call"}
                  </span>
                  <Link
                    href={`/vehicles/${linkedVehicle.slug}`}
                    target="_blank"
                    className="text-[10px] uppercase font-sans tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                  >
                    View Public Dossier &rarr;
                  </Link>
                </div>
              )}
            </div>

            {/* Exactly what the visitor wrote */}
            {activeLead.requestDetails && (
              <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                  Original Visitor Message:
                </span>
                <p className="text-xs text-[var(--text-primary)] font-serif italic leading-relaxed">
                  &ldquo;{activeLead.requestDetails}&rdquo;
                </p>
              </div>
            )}

            {/* Assignment & Branch info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                  Branch
                </span>
                <span className="text-xs font-serif text-[var(--text-primary)] capitalize mt-0.5 block">
                  {activeLead.branch === "polonnaruwa"
                    ? "Kaduruwela Head Office"
                    : "Trincomalee Branch"}
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                  Assigned Staff
                </span>
                {isOwner ? (
                  <select
                    value={activeLead.assignedTo || ""}
                    onChange={(e) => handleReassign(activeLead.id, e.target.value)}
                    className="w-full h-8 mt-1 px-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] rounded-[1px]"
                  >
                    <option value="Staff 01">Staff 01 (Kaduruwela)</option>
                    <option value="Staff 02">Staff 02 (Kaduruwela)</option>
                    <option value="S.M. Fajith (Proprietor)">S.M. Fajith (Proprietor)</option>
                  </select>
                ) : (
                  <span className="text-xs font-serif text-[var(--text-primary)] mt-0.5 block">
                    {activeLead.assignedTo || "Showroom Team"}
                  </span>
                )}
              </div>
            </div>

            {/* Notes Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                Activity &amp; Notes Timeline ({activeLead.notes.length})
              </span>

              {/* Add Note Form */}
              <form onSubmit={handleAddSlideNote} className="space-y-2">
                <textarea
                  rows={2}
                  required
                  value={slideNoteText}
                  onChange={(e) => setSlideNoteText(e.target.value)}
                  placeholder="Log call outcome, price offer, or viewing impressions..."
                  className="w-full p-2.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="min-h-[38px] px-4 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNote ? "Adding..." : "+ Append Note"}
                </button>
              </form>

              {/* Timeline list */}
              <div className="space-y-2 pt-2">
                {activeLead.notes.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)] italic">
                    No notes recorded yet. Log conversation notes above.
                  </p>
                ) : (
                  activeLead.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1 text-xs"
                    >
                      <p className="text-[var(--text-primary)] font-light leading-relaxed">
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-hairline)]">
                        <span>Logged by {note.author}</span>
                        <span>{formatRelativeTime(note.time)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Owner Delete Button */}
            {isOwner && (
              <div className="pt-6 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => setDeleteLeadTarget(activeLead)}
                  className="text-xs font-sans uppercase tracking-wider text-red-400 hover:text-red-300 min-h-[44px] inline-flex items-center cursor-pointer"
                >
                  Delete Lead Record (Director Only)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD LEAD (Phone / Walk-in) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 sm:p-8 space-y-6 shadow-2xl z-10 rounded-[2px]">
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div>
                <Eyebrow>Showroom Intake</Eyebrow>
                <Heading level={2} className="text-2xl mt-0.5">
                  Register New Enquiry
                </Heading>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                  Record walk-in showroom visitors or telephone enquiries
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lead-name"
                    className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                  >
                    Customer Full Name *
                  </label>
                  <input
                    id="lead-name"
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Kasun Jayawardena"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-phone"
                    className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                  >
                    Telephone / WhatsApp *
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="e.g. 077 123 4567"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lead-veh"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                >
                  Vehicle of Interest
                </label>
                <input
                  id="lead-veh"
                  type="text"
                  value={addVehicleTitle}
                  onChange={(e) => setAddVehicleTitle(e.target.value)}
                  placeholder="e.g. 2023 Toyota Land Cruiser Prado TX-L / Axio Hybrid"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lead-source"
                    className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                  >
                    Channel Source
                  </label>
                  <select
                    id="lead-source"
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value as LeadSource)}
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="phone">Direct Phone Call</option>
                    <option value="walk_in">Showroom Walk-In</option>
                    <option value="whatsapp">Direct WhatsApp</option>
                    <option value="website_form">Website Form</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lead-branch"
                    className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                  >
                    Showroom Branch
                  </label>
                  <select
                    id="lead-branch"
                    value={addBranch}
                    onChange={(e) => setAddBranch(e.target.value as DealershipBranch)}
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="polonnaruwa">Kaduruwela Head Office</option>
                    <option value="trincomalee">Trincomalee Coastal</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="lead-note"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                >
                  Customer Request / Initial Note
                </label>
                <textarea
                  id="lead-note"
                  rows={3}
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Customer visited showroom looking for Pearl White Prado. Budget around 45M."
                  className="w-full p-2.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? "Saving..." : "Save & Open Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS WON (Prompt to mark vehicle Sold) */}
      {wonLeadTarget && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setWonLeadTarget(null)}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 sm:p-8 space-y-5 shadow-2xl z-10 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400 font-semibold block">
                Sale Closed
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Mark Enquiry as Won
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Congratulations on closing the deal with{" "}
                <strong className="text-[var(--text-primary)]">{wonLeadTarget.name}</strong>!
              </p>
            </div>

            {wonLeadTarget.vehicleTitle && (
              <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  Vehicle:
                </span>
                <p className="text-sm font-serif text-[var(--text-primary)]">
                  {wonLeadTarget.vehicleTitle}
                </p>
              </div>
            )}

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Would you also like to mark the vehicle as <strong>Sold</strong> in showroom inventory
              and update the live website?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmWon(true)}
                className="w-full min-h-[44px] px-4 flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-green-800 text-white hover:bg-green-700 transition-colors rounded-[2px] cursor-pointer"
              >
                Yes, Mark Won &amp; Set Vehicle as Sold
              </button>

              <button
                type="button"
                onClick={() => handleConfirmWon(false)}
                className="w-full min-h-[44px] px-4 flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors rounded-[2px] cursor-pointer"
              >
                Mark Won Only (Keep Vehicle Available)
              </button>

              <button
                type="button"
                onClick={() => setWonLeadTarget(null)}
                className="w-full min-h-[38px] text-xs uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS LOST (Ask for reason) */}
      {lostLeadTarget && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLostLeadTarget(null)}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 sm:p-8 space-y-5 shadow-2xl z-10 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                Close Enquiry
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Mark Enquiry as Lost
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Please select why {lostLeadTarget.name} did not proceed:
              </p>
            </div>

            <div className="space-y-2">
              {[
                "Price too high / budget mismatch",
                "Purchased another vehicle elsewhere",
                "Customer unreachable / not responding",
                "Postponed vehicle purchase / changed mind",
                "Vehicle specifications did not match requirements",
                "Other",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-xs text-[var(--text-primary)] cursor-pointer hover:border-[var(--accent)]"
                >
                  <input
                    type="radio"
                    name="lost-reason"
                    checked={lostReasonChoice === reason}
                    onChange={() => setLostReasonChoice(reason)}
                    className="accent-[var(--accent)]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {lostReasonChoice === "Other" && (
              <div>
                <input
                  type="text"
                  placeholder="Specify brief reason..."
                  value={lostReasonCustom}
                  onChange={(e) => setLostReasonCustom(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setLostLeadTarget(null)}
                className="min-h-[44px] px-4 text-xs uppercase text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLost}
                className="min-h-[44px] px-6 text-xs font-sans uppercase font-medium tracking-wider bg-neutral-700 text-white hover:bg-neutral-600 rounded-[2px] cursor-pointer"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE LEAD (Owner Only) */}
      {deleteLeadTarget && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteLeadTarget(null)}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-red-900/50 p-6 sm:p-8 space-y-4 shadow-2xl z-10 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400 font-semibold block">
                Director Confirmation
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Permanently Delete Lead?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Are you sure you want to permanently delete the enquiry record for{" "}
                <strong className="text-[var(--text-primary)]">{deleteLeadTarget.name}</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setDeleteLeadTarget(null)}
                className="min-h-[44px] px-4 text-xs uppercase text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-6 text-xs font-sans uppercase font-medium tracking-wider bg-red-900 text-white hover:bg-red-800 rounded-[2px] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
