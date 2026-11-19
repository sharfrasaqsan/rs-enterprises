"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
import {
  formatPhoneDisplay,
  buildWhatsAppUrl,
  normalizePhoneNumber,
  isSamePhoneNumber,
} from "@/lib/phone";
import {
  SavedSearch,
} from "@/types/saved-search";
import {
  triggerManualSavedSearchAlertAction,
  updateSavedSearchStatusAction,
  deleteSavedSearchAction,
} from "@/app/actions/saved-searches";
import { SavedSearchesManager } from "./SavedSearchesManager";

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
  initialSavedSearches = [],
}: {
  initialLeads: Lead[];
  vehicles?: Vehicle[];
  initialSavedSearches?: SavedSearch[];
}) {
  const { user } = useAdminAuth();
  const searchParams = useSearchParams();
  const isOwner = user?.role === "owner";

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(initialSavedSearches);
  const [activeTab, setActiveTab] = useState<"pipeline" | "saved_searches">("pipeline");

  // View Mode: Default to Table View for clean non-technical showroom operation
  const [viewMode, setViewMode] = useState<"board" | "table">("table");

  // Stage Filter: "all" | "new" | "contacted" | "viewing" | "negotiating" | "won" | "lost"
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Lifecycle Scope: "active" (open leads + closed within 30 days) vs "all" (complete historical archive)
  const [pipelineScope, setPipelineScope] = useState<"active" | "all">("active");

  // Urgency filter
  const [urgencyFilter] = useState<"all" | "followup_due" | "unassigned" | "multi_inquiry">("all");

  // Table view sorting
  const [tableSortField, setTableSortField] = useState<"date" | "name" | "followup" | "stage">("date");
  const [tableSortOrder, setTableSortOrder] = useState<"asc" | "desc">("desc");

  // Monthly Customers Filter: "all" | "this_month" | "last_month" | "YYYY-MM"
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const [selectedMobileStage, setSelectedMobileStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch] = useState<string>("all");
  const [filterSource] = useState<string>("all");
  const [filterStaff] = useState<string>("all");

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

  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  function handleViewModeChange(mode: "board" | "table") {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("rs_admin_leads_view", mode);
      } catch {
        // ignore storage errors
      }
    }
  }

  // Check URL query param for default opened lead, add action, view mode, or month
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTimeMs(new Date().getTime());
      const qLead = searchParams.get("lead");
      if (qLead) {
        setActiveLeadId(qLead);
      }
      const qAction = searchParams.get("action");
      if (qAction === "new") {
        setShowAddModal(true);
      }
      const qView = searchParams.get("view");
      if (qView === "table" || qView === "board") {
        setViewMode(qView);
      } else if (typeof window !== "undefined") {
        try {
          const savedView = localStorage.getItem("rs_admin_leads_view");
          if (savedView === "table" || savedView === "board") {
            setViewMode(savedView);
          }
        } catch {
          // ignore storage errors
        }
      }
      const qMonth = searchParams.get("month");
      if (qMonth) {
        setFilterMonth(qMonth);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Derived active lead
  const activeLead = leads.find((l) => l.id === activeLeadId) || null;

  // Dynamic Month Computations for Monthly Customers Filter
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const lastYearMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { label: string; count: number }>();
    for (const l of leads) {
      if (!l.createdAt) continue;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const current = monthMap.get(key) || { label, count: 0 };
      current.count += 1;
      monthMap.set(key, current);
    }
    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, val]) => ({ key, label: val.label, count: val.count }));
  }, [leads]);

  const activeMonthLabel = useMemo(() => {
    if (filterMonth === "all") return "All Time";
    if (filterMonth === "this_month") {
      return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    if (filterMonth === "last_month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    if (/^\d{4}-\d{2}$/.test(filterMonth)) {
      const [y, m] = filterMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      }
    }
    const found = availableMonths.find((m) => m.key === filterMonth);
    return found ? found.label : filterMonth;
  }, [filterMonth, availableMonths]);

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    // 0. Monthly Customers Filter
    if (filterMonth !== "all") {
      let targetYM = filterMonth;
      if (filterMonth === "this_month") targetYM = currentYearMonth;
      if (filterMonth === "last_month") targetYM = lastYearMonth;

      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return false;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (ym !== targetYM) return false;
    }

    // 0.5. Stage Tab Filter
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;

    // 1. Pipeline Scope: In "active" mode, exclude closed won/lost leads that are older than 30 days
    // Note: If user selected a specific past month, do not hide that month's closed deals
    if (
      pipelineScope === "active" &&
      (filterMonth === "all" || filterMonth === "this_month") &&
      (l.stage === "won" || l.stage === "lost")
    ) {
      const updatedTime = new Date(l.updatedAt || l.createdAt).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (currentTimeMs && currentTimeMs - updatedTime > thirtyDaysMs) {
        return false;
      }
    }

    // 2. Urgency Filter
    if (urgencyFilter === "followup_due") {
      if (!l.followUpDate) return false;
      const todayStr = new Date().toISOString().split("T")[0];
      const dueDateStr = l.followUpDate.split("T")[0];
      if (dueDateStr > todayStr || l.stage === "won" || l.stage === "lost") return false;
    } else if (urgencyFilter === "unassigned") {
      if ((l.assignedTo && l.assignedTo.trim() !== "") || l.stage === "won" || l.stage === "lost") return false;
    } else if (urgencyFilter === "multi_inquiry") {
      if (!l.isReturningBuyer && (!l.inquiryCount || l.inquiryCount <= 1)) return false;
    }

    // 3. Dropdown Filters
    if (filterBranch !== "all" && l.branch !== filterBranch) return false;
    if (filterSource !== "all" && l.source !== filterSource) return false;
    if (filterStaff !== "all") {
      if (filterStaff === "unassigned" && l.assignedTo) return false;
      if (filterStaff !== "unassigned" && l.assignedTo !== filterStaff) return false;
    }

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      const matchVehicle = l.vehicleTitle?.toLowerCase().includes(q) || false;
      if (!matchName && !matchPhone && !matchVehicle) return false;
    }

    return true;
  });

  // Monthly KPI performance summary for the filtered leads
  const monthlyMetrics = useMemo(() => {
    const total = filteredLeads.length;
    const won = filteredLeads.filter((l) => l.stage === "won").length;
    const lost = filteredLeads.filter((l) => l.stage === "lost").length;
    const active = filteredLeads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
    const tradeIns = filteredLeads.filter((l) => l.source === "trade_in").length;
    return { total, won, lost, active, winRate, tradeIns };
  }, [filteredLeads]);

  // Table Sorted Leads
  const sortedTableLeads = [...filteredLeads].sort((a, b) => {
    let comparison = 0;
    if (tableSortField === "date") {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (tableSortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (tableSortField === "followup") {
      const aDate = a.followUpDate ? new Date(a.followUpDate).getTime() : 0;
      const bDate = b.followUpDate ? new Date(b.followUpDate).getTime() : 0;
      comparison = bDate - aDate;
    } else if (tableSortField === "stage") {
      comparison = a.stage.localeCompare(b.stage);
    }
    return tableSortOrder === "asc" ? -comparison : comparison;
  });

  const toggleTableSort = (field: "date" | "name" | "followup" | "stage") => {
    if (tableSortField === field) {
      setTableSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setTableSortField(field);
      setTableSortOrder("desc");
    }
  };

  const totalArchivedClosedCount = leads.filter((l) => {
    if (l.stage !== "won" && l.stage !== "lost") return false;
    const updatedTime = new Date(l.updatedAt || l.createdAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return currentTimeMs && currentTimeMs - updatedTime > thirtyDaysMs;
  }).length;

  // Helpers for formatting
  function formatSourceLabel(source: LeadSource): string {
    switch (source) {
      case "website_form":
        return "Web Form";
      case "vehicle_request":
        return "Vehicle Req";
      case "trade_in":
        return "Trade-In";
      case "whatsapp":
        return "WhatsApp";
      case "phone":
        return "Phone Call";
      case "walk_in":
        return "Walk-in";
      default:
        return source;
    }
  }

  function getWhatsAppUrl(phone: string, name: string, vehicleTitle?: string | null): string {
    const msg = `Hello ${name}, this is RS Enterprises Kaduruwela Showroom contacting you regarding ${
      vehicleTitle || "your Japanese vehicle inquiry"
    }. How may we assist you today?`;
    return buildWhatsAppUrl(phone, msg);
  }

  function formatRelativeTime(dateStr: string): string {
    try {
      if (!currentTimeMs) {
        return new Date(dateStr).toLocaleDateString("en-LK", { month: "short", day: "numeric" });
      }
      const diffMs = currentTimeMs - new Date(dateStr).getTime();
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
      if (res.isMerged) {
        // Update existing lead in local state
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === res.leadId) {
              const updatedCount = res.inquiryCount || (l.inquiryCount || 1) + 1;
              return {
                ...l,
                phone: normalizePhoneNumber(addPhone),
                vehicleTitle: addVehicleTitle.trim() || l.vehicleTitle,
                stage: "new",
                isReturningBuyer: true,
                inquiryCount: updatedCount,
                updatedAt: new Date().toISOString(),
              };
            }
            return l;
          })
        );
      } else {
        const newLeadObj: Lead = {
          id: res.leadId,
          name: addName.trim(),
          phone: normalizePhoneNumber(addPhone.trim()),
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
          inquiryCount: 1,
          isReturningBuyer: false,
          inquiries: [
            {
              id: `inq-${Date.now()}`,
              time: new Date().toISOString(),
              source: addSource,
              branch: addBranch,
              vehicleId: null,
              vehicleTitle: addVehicleTitle.trim() || null,
              requestDetails: addNote.trim() || null,
            },
          ],
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
      }

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
      const nowIso = new Date().toISOString();
      const newNote = {
        id: `note-${nowIso.replace(/[^0-9]/g, "")}`,
        text,
        author,
        time: nowIso,
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

  // Send WhatsApp Alert to Buyer for Saved Search
  async function handleSendSavedSearchAlert(savedSearchId: string, vehicleId: string) {
    const res = await triggerManualSavedSearchAlertAction(savedSearchId, vehicleId);
    if (res.success && res.whatsappUrl) {
      window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      setSavedSearches((prev) =>
        prev.map((s) =>
          s.id === savedSearchId
            ? {
                ...s,
                status: "notified",
                lastNotifiedAt: new Date().toISOString(),
                matchedVehicleIds: s.matchedVehicleIds.includes(vehicleId)
                  ? s.matchedVehicleIds
                  : [...s.matchedVehicleIds, vehicleId],
              }
            : s
        )
      );
    } else {
      alert(res.error || "Failed to trigger alert.");
    }
  }

  // Fulfill Saved Search Alert
  async function handleFulfillSavedSearch(savedSearchId: string) {
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === savedSearchId ? { ...s, status: "fulfilled" } : s))
    );
    await updateSavedSearchStatusAction(savedSearchId, "fulfilled");
  }

  // Delete Saved Search Alert
  async function handleDeleteSavedSearch(savedSearchId: string) {
    if (!confirm("Are you sure you want to remove this back-in-stock alert?")) return;
    setSavedSearches((prev) => prev.filter((s) => s.id !== savedSearchId));
    await deleteSavedSearchAction(savedSearchId);
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
                    title: "RS ENTERPRISES • CUSTOMER ENQUIRIES & PIPELINE REPORT",
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
                        title:
                          filterMonth !== "all"
                            ? `RS ENTERPRISES • ${activeMonthLabel.toUpperCase()} CUSTOMERS & ENQUIRIES REPORT`
                            : "RS ENTERPRISES • FILTERED CUSTOMERS & ENQUIRIES REPORT",
                        filterSummary:
                          filterMonth !== "all"
                            ? `${activeMonthLabel} Monthly Customers (${filteredLeads.length} of ${leads.length} Records)`
                            : `Filtered View (${filteredLeads.length} of ${leads.length} Records)`,
                      });
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-[2px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                        <span>{filterMonth !== "all" ? `${activeMonthLabel} Report` : "Filtered View"}</span>
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
                        title: "RS ENTERPRISES • COMPLETE CUSTOMERS & ENQUIRIES REPORT",
                        filterSummary: `All Showroom Records (${leads.length} Total Records)`,
                      });
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-[2px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                        <span>All Showroom Records</span>
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

      {/* View Switcher: Pipeline vs Back-in-Stock & Saved Searches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-hairline)] gap-4 pb-2">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            className={`pb-3 text-xs font-sans uppercase tracking-[0.14em] font-medium transition-colors relative cursor-pointer ${
              activeTab === "pipeline"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Enquiry Pipeline</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-full">
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved_searches")}
            className={`pb-3 text-xs font-sans uppercase tracking-[0.14em] font-medium transition-colors relative cursor-pointer ${
              activeTab === "saved_searches"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Saved Searches &amp; Stock Alerts</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--accent)] text-white rounded-full">
              {savedSearches.length}
            </span>
          </button>
        </div>

        {/* Board vs Table Toggle */}
        {activeTab === "pipeline" && (
          <div className="flex items-center gap-2 self-start sm:self-auto pb-2 sm:pb-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hidden md:inline">
              Layout:
            </span>
            <div className="inline-flex p-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
              <button
                type="button"
                onClick={() => handleViewModeChange("board")}
                className={`h-8 px-3 inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === "board"
                    ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                title="Kanban Drag & Drop Board"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span>Board</span>
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`h-8 px-3 inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                title="High-Density Table View for Long-Term Scale & Triage"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Table</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "pipeline" ? (
        <>
          {/* Search, Month Calendar, & Quick Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input (7 Cols) */}
            <div className="sm:col-span-7">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer name, phone number, or car requested..."
                className="w-full h-11 px-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Monthly Calendar Input (5 Cols) */}
            <div className="sm:col-span-5 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="month"
                  value={
                    filterMonth === "all"
                      ? ""
                      : filterMonth === "this_month"
                      ? currentYearMonth
                      : filterMonth === "last_month"
                      ? lastYearMonth
                      : filterMonth
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMonth(val || "all");
                  }}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                    } catch {
                      // Fallback
                    }
                  }}
                  className="w-full h-11 pl-9 pr-9 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono cursor-pointer"
                  title="Click to open calendar and select any month"
                  aria-label="Select Calendar Month"
                />

                {/* Left Calendar Icon */}
                <div className="absolute left-3 pointer-events-none text-[var(--accent)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>

                {/* Clear / All indicator */}
                {filterMonth !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setFilterMonth("all")}
                    className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-xs text-[var(--text-secondary)] hover:text-status-danger hover:bg-[var(--bg-base)] rounded-[1px] transition-colors cursor-pointer"
                    title="Clear month filter (Show all time)"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="absolute right-2.5 text-[9px] font-mono text-[var(--text-muted)] pointer-events-none uppercase">
                    All
                  </span>
                )}
              </div>

              {/* Quick This Month / All Months Switcher */}
              <div className="inline-flex p-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMonth("all")}
                  className={`h-8 px-2.5 text-[10px] font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                    filterMonth === "all"
                      ? "bg-[var(--accent)] text-white font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                  title="Show all customer inquiries across all dates"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMonth("this_month")}
                  className={`h-8 px-2.5 text-[10px] font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMonth === "this_month"
                      ? "bg-[var(--accent)] text-white font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                  title="Filter to current month customer inquiries"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>This Month</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clean Stage Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border-hairline)]">
            {[
              { key: "all", label: "All Inquiries", count: leads.length, dot: "" },
              { key: "new", label: "New", count: leads.filter((l) => l.stage === "new").length, dot: "bg-amber-400" },
              { key: "contacted", label: "Contacted", count: leads.filter((l) => l.stage === "contacted").length, dot: "bg-purple-400" },
              { key: "viewing", label: "Viewing / Test", count: leads.filter((l) => l.stage === "viewing").length, dot: "bg-blue-400" },
              { key: "negotiating", label: "Negotiating", count: leads.filter((l) => l.stage === "negotiating").length, dot: "bg-amber-600" },
              { key: "won", label: "Won (Sold)", count: leads.filter((l) => l.stage === "won").length, dot: "bg-emerald-500" },
              { key: "lost", label: "Closed / Lost", count: leads.filter((l) => l.stage === "lost").length, dot: "bg-slate-400" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStageFilter(tab.key)}
                className={`h-9 px-3.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  stageFilter === tab.key
                    ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] border border-[var(--border-hairline)]"
                }`}
              >
                {tab.dot && (
                  <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
                )}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-mono rounded-[1px] ${
                    stageFilter === tab.key
                      ? "bg-black/20 text-white"
                      : "bg-[var(--bg-base)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Archived notice if older closed records are hidden */}
          {pipelineScope === "active" && totalArchivedClosedCount > 0 && (
            <div className="px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold">●</span>
                <span>
                  Showing active showroom inquiries. {totalArchivedClosedCount} older closed deals are safely archived.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPipelineScope("all")}
                className="text-[10px] font-sans uppercase font-medium text-[var(--accent)] hover:underline ml-2 cursor-pointer"
              >
                View Complete History ({leads.length})
              </button>
            </div>
          )}

          {viewMode === "board" ? (
            <>
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
                        {/* Name & Phone */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-serif text-base text-[var(--text-primary)] font-medium leading-snug block">
                              {lead.name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                              {formatPhoneDisplay(lead.phone)}
                            </span>
                          </div>
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

                          {(lead.isReturningBuyer || (lead.inquiryCount && lead.inquiryCount > 1)) && (
                            <span
                              className="px-1.5 py-0.2 badge-status-warning font-semibold rounded-[1px] flex items-center gap-1"
                              title={`${lead.inquiryCount || 2} inquiries merged into this client file`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>{lead.inquiryCount || 2}x Merged</span>
                            </span>
                          )}

                          {isClosed ? (
                            <span
                              className={`px-1.5 py-0.2 uppercase rounded-[1px] font-semibold ${
                                lead.stage === "won"
                                  ? "badge-status-success"
                                  : "badge-status-neutral"
                              }`}
                            >
                              {lead.stage === "won" ? "Won (Sold)" : "Lost"}
                            </span>
                          ) : lead.followUpDate ? (
                            <span className="px-1.5 py-0.2 badge-status-warning font-semibold rounded-[1px]">
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
                              className="min-h-[32px] px-2 inline-flex items-center gap-1 text-[10px] uppercase font-sans font-medium tracking-wider bg-[#25D366] text-white hover:bg-[#20ba59] rounded-[2px] transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.077-1.782-.397-1.424-.589-2.348-2.029-2.42-2.125-.071-.096-.575-.765-.575-1.458 0-.693.361-1.033.49-1.177.129-.144.282-.18.377-.18.094 0 .188.001.27.005.086.004.202-.033.315.239.119.284.405.992.441 1.064.036.072.06.156.012.252-.048.096-.072.156-.144.24-.072.084-.152.188-.217.252-.072.072-.147.151-.063.295.084.144.373.616.8 1.002.549.497 1.013.652 1.157.724.144.072.228.06.313-.036.084-.096.36-.42.456-.564.096-.144.193-.12.325-.072.132.048.841.396.985.468.144.072.24.108.276.168.036.06.036.348-.108.753z"/>
                              </svg>
                              <span>WA</span>
                            </a>
                          </div>

                          {/* Fallback stage move button */}
                          {!isClosed && (
                            <select
                              value={lead.stage}
                              onChange={(e) =>
                                handleStageChange(lead.id, e.target.value as LeadStage)
                              }
                              className="h-8 px-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="viewing">Viewing</option>
                              <option value="negotiating">Negotiating</option>
                              <option value="won">Won (Sold)</option>
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
                  <span className="text-[var(--text-secondary)]">
                    {formatPhoneDisplay(lead.phone)}
                  </span>
                  {(lead.isReturningBuyer || (lead.inquiryCount && lead.inquiryCount > 1)) && (
                    <span className="px-2 py-0.5 badge-status-warning font-semibold rounded-[1px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{lead.inquiryCount || 2}x Merged</span>
                    </span>
                  )}
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
    </>
  ) : (
    /* HIGH-DENSITY TABLE VIEW (OPTIMIZED FOR LONG-TERM SCALE & TRIAGE) */
    <div className="space-y-4">
      {/* Monthly Customer Table View KPI & Filter Header */}
      <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold">
              Monthly Customers Table View
            </span>
            {filterMonth !== "all" && (
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 rounded-[1px] font-semibold">
                {activeMonthLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-semibold">{sortedTableLeads.length}</strong> {filterMonth !== "all" ? `${activeMonthLabel}` : "total"} customer inquiries
            </span>
            {filterMonth !== "all" && (
              <button
                type="button"
                onClick={() => setFilterMonth("all")}
                className="text-[var(--accent)] hover:underline text-[11px] cursor-pointer"
              >
                (View All Months)
              </button>
            )}
          </div>
        </div>

        {/* Monthly Performance KPI Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center gap-2">
            <span className="text-[var(--text-secondary)] uppercase text-[10px]">Total:</span>
            <span className="font-semibold text-[var(--text-primary)]">{monthlyMetrics.total}</span>
          </div>
          <div className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[var(--text-secondary)] uppercase text-[10px]">Won (Sold):</span>
            <span className="font-semibold text-status-success">{monthlyMetrics.won}</span>
            {monthlyMetrics.total > 0 && (
              <span className="text-[10px] text-status-success opacity-85">({monthlyMetrics.winRate}%)</span>
            )}
          </div>
          <div className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[var(--text-secondary)] uppercase text-[10px]">Active Pipeline:</span>
            <span className="font-semibold text-status-warning">{monthlyMetrics.active}</span>
          </div>
          <div className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="text-[var(--text-secondary)] uppercase text-[10px]">Lost:</span>
            <span className="font-semibold text-[var(--text-secondary)]">{monthlyMetrics.lost}</span>
          </div>
          {monthlyMetrics.tradeIns > 0 && (
            <div className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex items-center gap-2">
              <span className="text-[var(--text-secondary)] uppercase text-[10px]">Trade-Ins:</span>
              <span className="font-semibold text-[var(--accent)]">{monthlyMetrics.tradeIns}</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-base)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleTableSort("name")}
                    className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <span>Customer</span>
                    {tableSortField === "name" && (
                      <span className="text-[var(--accent)]">{tableSortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Vehicle of Interest</th>
                <th className="py-3 px-4">Channel / Branch</th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleTableSort("stage")}
                    className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <span>Stage (1-Tap Change)</span>
                    {tableSortField === "stage" && (
                      <span className="text-[var(--accent)]">{tableSortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleTableSort("followup")}
                    className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <span>Next Follow-Up</span>
                    {tableSortField === "followup" && (
                      <span className="text-[var(--accent)]">{tableSortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleTableSort("date")}
                    className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <span>Logged (Date &amp; Month)</span>
                    {tableSortField === "date" && (
                      <span className="text-[var(--accent)]">{tableSortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)] text-xs">
              {sortedTableLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                    <p className="italic">
                      {filterMonth !== "all"
                        ? `No customer inquiries recorded for ${activeMonthLabel}.`
                        : "No customer inquiries match this filter criteria."}
                    </p>
                    {filterMonth !== "all" && (
                      <button
                        type="button"
                        onClick={() => setFilterMonth("all")}
                        className="mt-3 px-4 py-1.5 text-xs font-sans uppercase tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[2px] transition-colors cursor-pointer"
                      >
                        Show All Months
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedTableLeads.map((lead) => {
                  const waUrl = getWhatsAppUrl(lead.phone, lead.name, lead.vehicleTitle);
                  const isClosed = lead.stage === "won" || lead.stage === "lost";

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setActiveLeadId(lead.id)}
                      className={`hover:bg-[var(--bg-base)]/80 transition-colors cursor-pointer group ${
                        activeLeadId === lead.id ? "bg-[var(--accent)]/5" : ""
                      }`}
                    >
                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {lead.name}
                          </span>
                          {(lead.isReturningBuyer || (lead.inquiryCount && lead.inquiryCount > 1)) && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono badge-status-warning rounded-[1px] font-semibold">
                              {lead.inquiryCount || 2}x Merged
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-[var(--text-secondary)] block mt-0.5">
                          {formatPhoneDisplay(lead.phone)}
                        </span>
                      </td>

                      {/* Vehicle Title */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="text-xs text-[var(--text-primary)] font-medium line-clamp-1">
                          {lead.vehicleTitle || "General Showroom Inquiry"}
                        </span>
                        {lead.requestDetails && (
                          <span className="text-[10px] text-[var(--text-secondary)] italic font-light line-clamp-1 mt-0.5">
                            &ldquo;{lead.requestDetails}&rdquo;
                          </span>
                        )}
                      </td>

                      {/* Channel / Branch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] rounded-[1px]">
                            {formatSourceLabel(lead.source)}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)] rounded-[1px] font-medium">
                            {lead.branch === "polonnaruwa" ? "Kadurwela" : "Trinco"}
                          </span>
                        </div>
                      </td>

                      {/* Stage (1-Tap Dropdown) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              lead.stage === "won"
                                ? "bg-emerald-500"
                                : lead.stage === "lost"
                                ? "bg-slate-400"
                                : lead.stage === "negotiating"
                                ? "bg-amber-600"
                                : lead.stage === "viewing"
                                ? "bg-blue-500"
                                : lead.stage === "contacted"
                                ? "bg-purple-500"
                                : "bg-amber-400"
                            }`}
                          />
                          <select
                            value={lead.stage}
                            onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                            className="h-8 pl-2 pr-6 text-xs font-sans font-medium rounded-[2px] cursor-pointer bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)] hover:border-[var(--border-focus)] transition-colors shadow-xs"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="viewing">Viewing / Test Drive</option>
                            <option value="negotiating">Negotiating</option>
                            <option value="won">Won (Sold)</option>
                            <option value="lost">Closed / Lost</option>
                          </select>
                        </div>
                      </td>

                      {/* Next Follow-Up */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          if (!lead.followUpDate) {
                            return (
                              <span className="text-[10px] font-mono text-[var(--text-secondary)] italic">
                                No follow-up set
                              </span>
                            );
                          }
                          const todayStr = new Date().toISOString().split("T")[0];
                          const dueDateStr = lead.followUpDate.split("T")[0];
                          const isOverdue = dueDateStr < todayStr && !isClosed;
                          const isDueToday = dueDateStr === todayStr && !isClosed;

                          return (
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded-[2px] font-semibold ${
                                isOverdue
                                  ? "badge-status-danger"
                                  : isDueToday
                                  ? "badge-status-warning"
                                  : "bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                              }`}
                            >
                              {isOverdue ? "Overdue: " : isDueToday ? "Due Today: " : "Due: "}
                              {dueDateStr}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          {lead.assignedTo || "Unassigned"}
                        </span>
                      </td>

                      {/* Date Logged with Clear Month & Day */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono text-[var(--text-primary)] whitespace-nowrap font-medium">
                            {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                            {formatRelativeTime(lead.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <a
                            href={`tel:${lead.phone}`}
                            className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded-[2px] transition-colors"
                            title="Call client"
                          >
                            <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Call</span>
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-sans uppercase font-medium tracking-wider bg-[#25D366] text-white hover:bg-[#20ba59] rounded-[2px] transition-colors shadow-xs"
                            title="Open WhatsApp chat"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.077-1.782-.397-1.424-.589-2.348-2.029-2.42-2.125-.071-.096-.575-.765-.575-1.458 0-.693.361-1.033.49-1.177.129-.144.282-.18.377-.18.094 0 .188.001.27.005.086.004.202-.033.315.239.119.284.405.992.441 1.064.036.072.06.156.012.252-.048.096-.072.156-.144.24-.072.084-.152.188-.217.252-.072.072-.147.151-.063.295.084.144.373.616.8 1.002.549.497 1.013.652 1.157.724.144.072.228.06.313-.036.084-.096.36-.42.456-.564.096-.144.193-.12.325-.072.132.048.841.396.985.468.144.072.24.108.276.168.036.06.036.348-.108.753z"/>
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setActiveLeadId(lead.id)}
                            className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)] rounded-[2px] transition-colors"
                            title="Open customer details"
                          >
                            <span>View</span>
                            <span className="text-[var(--accent)] font-semibold">&rarr;</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile High-Density Compact List */}
      <div className="md:hidden space-y-2.5">
        {sortedTableLeads.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
            <p className="font-serif text-lg text-[var(--text-primary)]">
              {filterMonth !== "all"
                ? `No inquiries recorded for ${activeMonthLabel}`
                : "No inquiries match this filter"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Try switching months or clearing search filters.
            </p>
            {filterMonth !== "all" && (
              <button
                type="button"
                onClick={() => setFilterMonth("all")}
                className="mt-2 px-4 py-1.5 text-xs font-sans uppercase tracking-wider bg-[var(--accent)] text-white rounded-[2px]"
              >
                Show All Months
              </button>
            )}
          </div>
        ) : (
          sortedTableLeads.map((lead) => {
            const waUrl = getWhatsAppUrl(lead.phone, lead.name, lead.vehicleTitle);

            return (
              <div
                key={lead.id}
                onClick={() => setActiveLeadId(lead.id)}
                className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-2.5 cursor-pointer hover:border-[var(--accent)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-medium text-[var(--text-primary)]">
                        {lead.name}
                      </span>
                      {(lead.isReturningBuyer || (lead.inquiryCount && lead.inquiryCount > 1)) && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono badge-status-warning rounded-[1px] font-semibold">
                          {lead.inquiryCount || 2}x
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                      {formatPhoneDisplay(lead.phone)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-[var(--text-primary)] font-medium block">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] block">
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                  {lead.vehicleTitle || "General Showroom Inquiry"}
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                      className="h-8 px-2 text-xs font-sans font-medium bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-[2px] cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="viewing">Viewing</option>
                      <option value="negotiating">Negotiating</option>
                      <option value="won">Won (Sold)</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${lead.phone}`}
                      className="h-8 px-2 inline-flex items-center gap-1 text-[10px] font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-[2px]"
                      title="Call"
                    >
                      <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Call</span>
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2 inline-flex items-center gap-1 text-[10px] font-sans uppercase font-medium tracking-wider bg-[#25D366] text-white rounded-[2px]"
                      title="WhatsApp"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.077-1.782-.397-1.424-.589-2.348-2.029-2.42-2.125-.071-.096-.575-.765-.575-1.458 0-.693.361-1.033.49-1.177.129-.144.282-.18.377-.18.094 0 .188.001.27.005.086.004.202-.033.315.239.119.284.405.992.441 1.064.036.072.06.156.012.252-.048.096-.072.156-.144.24-.072.084-.152.188-.217.252-.072.072-.147.151-.063.295.084.144.373.616.8 1.002.549.497 1.013.652 1.157.724.144.072.228.06.313-.036.084-.096.36-.42.456-.564.096-.144.193-.12.325-.072.132.048.841.396.985.468.144.072.24.108.276.168.036.06.036.348-.108.753z"/>
                      </svg>
                      <span>WA</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveLeadId(lead.id)}
                      className="h-8 px-2 inline-flex items-center text-[10px] font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)] rounded-[2px]"
                      title="View Details"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )}
</>
) : (
<SavedSearchesManager
          savedSearches={savedSearches}
          vehicles={vehicles}
          onSendAlert={handleSendSavedSearchAlert}
          onFulfill={handleFulfillSavedSearch}
          onDelete={handleDeleteSavedSearch}
        />
      )}

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
                <Eyebrow>Customer Lead Profile</Eyebrow>
                <Heading level={2} className="text-2xl sm:text-3xl mt-0.5">
                  {activeLead.name}
                </Heading>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
                  <span>Tel: {formatPhoneDisplay(activeLead.phone)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 badge-status-success rounded-[1px] font-semibold">
                    ✓ +94 E.164
                  </span>
                  {activeLead.email ? <span>• {activeLead.email}</span> : ""}
                </div>
                {(activeLead.isReturningBuyer || (activeLead.inquiryCount && activeLead.inquiryCount > 1)) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 badge-status-warning font-semibold text-[10px] font-mono rounded-[1px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Returning Customer ({activeLead.inquiryCount || 2} Merged Inquiries)</span>
                  </div>
                )}
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
                <span>Print / Export Lead Profile (.PDF)</span>
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
                    className="text-[10px] font-mono text-status-danger hover:underline uppercase"
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
                    View Public Vehicle &rarr;
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
                  className="text-xs font-sans uppercase tracking-wider text-status-danger hover:opacity-80 min-h-[44px] inline-flex items-center cursor-pointer font-medium"
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
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="lead-phone"
                      className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)]"
                    >
                      Telephone / WhatsApp *
                    </label>
                    {addPhone.trim() && (
                      <span className="text-[10px] font-mono text-[var(--accent)] font-medium">
                        {normalizePhoneNumber(addPhone)}
                      </span>
                    )}
                  </div>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                  {/* Live duplicate detection match */}
                  {(() => {
                    if (!addPhone.trim()) return null;
                    const matchedLead = leads.find(
                      (l) =>
                        normalizePhoneNumber(l.phone) === normalizePhoneNumber(addPhone) ||
                        isSamePhoneNumber(l.phone, addPhone)
                    );
                    if (matchedLead) {
                      return (
                        <div className="mt-1.5 p-2.5 badge-status-warning text-xs rounded-[2px] space-y-0.5">
                          <div className="font-semibold flex items-center gap-1.5 text-status-warning">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Recurring Customer Match</span>
                          </div>
                          <p className="text-[11px] opacity-90 font-light">
                            Existing record found for <strong>{matchedLead.name}</strong> ({formatPhoneDisplay(matchedLead.phone)}). Submitting will automatically merge and append this new inquiry to their customer history.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                    <option value="trade_in">Trade-In Valuation</option>
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
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-status-success font-semibold block">
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
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-status-danger font-semibold block">
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
