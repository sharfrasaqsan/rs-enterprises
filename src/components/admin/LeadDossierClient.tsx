"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lead, LeadStage } from "@/types/lead";
import { Vehicle } from "@/types/vehicle";
import {
  updateLeadStageAction,
  addLeadNoteAction,
  setLeadFollowUpAction,
  markLeadWonWithVehicleAction,
  reassignLeadAction,
  deleteLeadAction,
} from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function LeadDossierClient({
  initialLead,
  vehicles = [],
}: {
  initialLead: Lead;
  vehicles?: Vehicle[];
}) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const isOwner = user?.role === "owner";

  const [lead, setLead] = useState<Lead>(initialLead);
  const [noteText, setNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate || "");

  // Mark Won Modal
  const [showWonModal, setShowWonModal] = useState(false);

  // Mark Lost Modal
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReasonChoice, setLostReasonChoice] = useState("Price too high / budget mismatch");
  const [lostReasonCustom, setLostReasonCustom] = useState("");

  // Delete Confirmation Modal (Owner Only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
  const formattedDigits = cleanPhone.startsWith("94")
    ? cleanPhone
    : cleanPhone.startsWith("0")
    ? "94" + cleanPhone.slice(1)
    : "94" + cleanPhone;

  const whatsappUrl = `https://wa.me/${formattedDigits}?text=${encodeURIComponent(
    `Hello ${lead.name}, RS Enterprises Kaduruwela showroom following up regarding ${
      lead.vehicleTitle || "your Japanese vehicle inquiry"
    }. How may we assist you today?`
  )}`;

  // Find linked vehicle
  const linkedVehicle = lead.vehicleId
    ? vehicles.find((v) => v.id === lead.vehicleId || v.slug === lead.vehicleId)
    : null;

  async function handleStageSelect(newStage: LeadStage) {
    if (newStage === "won") {
      setShowWonModal(true);
      return;
    }
    if (newStage === "lost") {
      setShowLostModal(true);
      return;
    }

    const author = user?.displayName || "Showroom Staff";
    setLead((prev) => ({ ...prev, stage: newStage, updatedBy: author }));
    await updateLeadStageAction(lead.id, newStage, undefined, author);
  }

  async function handleConfirmWon(markVehicleSold: boolean) {
    const author = user?.displayName || "Showroom Staff";
    setLead((prev) => ({ ...prev, stage: "won", updatedBy: author }));
    setShowWonModal(false);

    await markLeadWonWithVehicleAction(lead.id, markVehicleSold, lead.vehicleId, author);
  }

  async function handleConfirmLost() {
    const reason =
      lostReasonChoice === "Other"
        ? lostReasonCustom.trim() || "Other"
        : lostReasonChoice;
    const author = user?.displayName || "Showroom Staff";

    setLead((prev) => ({ ...prev, stage: "lost", lostReason: reason, updatedBy: author }));
    setShowLostModal(false);

    await updateLeadStageAction(lead.id, "lost", reason, author);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    const author = user?.displayName || "Showroom Staff";
    const text = noteText.trim();
    const res = await addLeadNoteAction(lead.id, text, author);
    setIsSubmittingNote(false);

    if (res.success) {
      const newNote = {
        id: `note-${Date.now()}`,
        text,
        author,
        time: new Date().toISOString(),
      };
      setLead((prev) => ({
        ...prev,
        notes: [...prev.notes, newNote],
      }));
      setNoteText("");
    }
  }

  async function handleSetQuickFollowUp(daysToAdd: number | null) {
    let dateStr: string | null = null;
    if (daysToAdd !== null) {
      const target = new Date();
      target.setDate(target.getDate() + daysToAdd);
      dateStr = target.toISOString().split("T")[0] || null;
    }

    const author = user?.displayName || "Showroom Staff";
    setLead((prev) => ({ ...prev, followUpDate: dateStr, updatedBy: author }));
    setFollowUpDate(dateStr || "");

    await setLeadFollowUpAction(lead.id, dateStr, author);
  }

  async function handleCustomFollowUpDate(dateVal: string) {
    const author = user?.displayName || "Showroom Staff";
    setFollowUpDate(dateVal);
    setLead((prev) => ({ ...prev, followUpDate: dateVal || null, updatedBy: author }));

    await setLeadFollowUpAction(lead.id, dateVal || null, author);
  }

  async function handleReassign(newStaff: string) {
    const author = user?.displayName || "Showroom Director";
    setLead((prev) => ({ ...prev, assignedTo: newStaff, updatedBy: author }));
    await reassignLeadAction(lead.id, newStaff, author);
  }

  async function handleConfirmDelete() {
    await deleteLeadAction(lead.id);
    router.push("/admin/leads");
    router.refresh();
  }

  function formatDateTime(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-LK", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back Breadcrumb */}
      <div>
        <Link
          href="/admin/leads"
          className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
        >
          &larr; Back to Leads Pipeline Board
        </Link>
      </div>

      {/* Header Customer Dossier Profile */}
      <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2px]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
            <span className="px-2 py-0.5 uppercase bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
              Stage: {lead.stage}
            </span>
            <span className="px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
              Branch: {lead.branch === "polonnaruwa" ? "Kaduruwela" : "Trincomalee"}
            </span>
            <span className="text-[var(--text-secondary)]">
              Source: {lead.source.replace("_", " ")}
            </span>
          </div>

          <Heading level={1} className="text-3xl sm:text-4xl">
            {lead.name}
          </Heading>

          <p className="font-mono text-sm text-[var(--text-secondary)]">
            Tel: {lead.phone} {lead.email ? `• ${lead.email}` : ""}
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="min-h-[48px] px-6 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors rounded-[2px]"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <span>Direct Call</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] px-6 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>WhatsApp (+94)</span>
          </a>
        </div>
      </div>

      {/* Grid: Left Column Details & Controls + Right Column Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stage Selector */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 rounded-[2px]">
            <Eyebrow>Sales Stage Control</Eyebrow>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
              1-Tap Advance Stage:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["new", "contacted", "viewing", "negotiating", "won", "lost"] as LeadStage[]).map(
                (stg) => {
                  const active = lead.stage === stg;
                  return (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => handleStageSelect(stg)}
                      className={`min-h-[44px] px-2 text-[10px] font-sans uppercase font-medium tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                        active
                          ? stg === "won"
                            ? "bg-green-800 text-white border-green-700 font-bold"
                            : stg === "lost"
                            ? "bg-neutral-700 text-white border-neutral-600"
                            : "bg-[var(--accent)] text-white border-[var(--accent)] font-bold shadow-sm"
                          : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
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

            {lead.lostReason && (
              <div className="p-3 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-[2px]">
                Closed Reason: {lead.lostReason}
              </div>
            )}
          </div>

          {/* Follow-up Date with Quick Choices */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 rounded-[2px]">
            <div className="flex items-center justify-between">
              <Eyebrow>Follow-up Reminder</Eyebrow>
              {lead.followUpDate && (
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(null)}
                  className="text-[10px] font-mono text-red-400 hover:underline uppercase"
                >
                  Clear Date
                </button>
              )}
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
              Quick Follow-up Presets:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSetQuickFollowUp(1)}
                className="min-h-[40px] px-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickFollowUp(3)}
                className="min-h-[40px] px-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickFollowUp(7)}
                className="min-h-[40px] px-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] font-sans uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px]"
              >
                Next Week
              </button>
            </div>

            <div className="pt-2">
              <label
                htmlFor="followup-custom"
                className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Or select exact date:
              </label>
              <input
                id="followup-custom"
                type="date"
                value={followUpDate ? followUpDate.split("T")[0] : ""}
                onChange={(e) => handleCustomFollowUpDate(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] font-mono"
              />
            </div>
          </div>

          {/* Vehicle of Interest Card */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 rounded-[2px]">
            <Eyebrow>Vehicle of Interest</Eyebrow>
            <h3 className="font-serif text-xl text-[var(--text-primary)]">
              {lead.vehicleTitle || "General Showroom Inquiry"}
            </h3>

            {linkedVehicle && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[var(--accent)] font-semibold text-sm">
                    {linkedVehicle.price
                      ? `LKR ${linkedVehicle.price.toLocaleString("en-US")}`
                      : "Price on Call"}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                    Status: {linkedVehicle.status}
                  </span>
                </div>
                <Link
                  href={`/vehicles/${linkedVehicle.slug}`}
                  target="_blank"
                  className="text-xs uppercase font-sans tracking-wider text-[var(--accent)] hover:underline inline-flex items-center pt-1"
                >
                  View Public Vehicle Dossier &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Exactly what the visitor wrote */}
          {lead.requestDetails && (
            <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 rounded-[2px]">
              <Eyebrow>Original Visitor Message</Eyebrow>
              <p className="text-xs text-[var(--text-primary)] font-serif italic leading-relaxed whitespace-pre-line bg-[var(--bg-base)] p-3 rounded-[2px] border border-[var(--border-hairline)]">
                &ldquo;{lead.requestDetails}&rdquo;
              </p>
            </div>
          )}

          {/* Staff Assignment & Branch */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 rounded-[2px]">
            <Eyebrow>Staff Ownership</Eyebrow>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                Assigned Sales Officer
              </span>
              {isOwner ? (
                <select
                  value={lead.assignedTo || ""}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
                >
                  <option value="Staff 01">Staff 01 (Kaduruwela)</option>
                  <option value="Staff 02">Staff 02 (Kaduruwela)</option>
                  <option value="S.M. Fajith (Proprietor)">S.M. Fajith (Proprietor)</option>
                </select>
              ) : (
                <p className="font-serif text-sm text-[var(--text-primary)]">
                  {lead.assignedTo || "Showroom Team"}
                </p>
              )}
            </div>
          </div>

          {/* Owner Only: Delete Lead */}
          {isOwner && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs font-sans uppercase tracking-wider text-red-400 hover:text-red-300 min-h-[44px] inline-flex items-center cursor-pointer"
              >
                Delete Lead Record (Director Only)
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Notes History Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6 rounded-[2px]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div>
                <Eyebrow>Activity Thread</Eyebrow>
                <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-0.5">
                  Customer Notes Timeline
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--accent)] font-semibold">
                {lead.notes?.length || 0} Entries
              </span>
            </div>

            {/* Note Entry Form */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <label
                htmlFor="new-note-text"
                className="block text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)]"
              >
                Append Note to Customer File
              </label>
              <textarea
                id="new-note-text"
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log customer price response, inspection impression, CIF quotation offered..."
                className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteText.trim()}
                className="min-h-[44px] px-6 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer disabled:opacity-50"
              >
                {isSubmittingNote ? "Saving Note..." : "+ Add Note to Timeline"}
              </button>
            </form>

            {/* Chronological Thread */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
              {!lead.notes || lead.notes.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] font-light italic">
                  No notes logged yet. Log the first customer conversation above.
                </p>
              ) : (
                <div className="space-y-3">
                  {[...lead.notes].reverse().map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-2 rounded-[2px]"
                    >
                      <p className="text-xs font-light text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-mono pt-1.5 border-t border-[var(--border-hairline)]">
                        <span className="text-[var(--accent)] font-semibold">
                          Logged by {note.author}
                        </span>
                        <span>{formatDateTime(note.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: MARK AS WON */}
      {showWonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400 font-semibold block">
                Sale Closed
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Mark Enquiry as Won
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Deal completed with <strong className="text-[var(--text-primary)]">{lead.name}</strong>.
              </p>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Would you also like to mark the vehicle{" "}
              <strong>{lead.vehicleTitle || "in showroom inventory"}</strong> as{" "}
              <strong>Sold</strong> and update the public website?
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
                onClick={() => setShowWonModal(false)}
                className="w-full min-h-[38px] text-xs uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS LOST */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                Close Enquiry
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Mark Enquiry as Lost
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Please select why this customer inquiry was closed:
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
                  className="flex items-center gap-2.5 p-2.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-xs text-[var(--text-primary)] cursor-pointer hover:border-[var(--accent)]"
                >
                  <input
                    type="radio"
                    name="lost-reason-detail"
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
                onClick={() => setShowLostModal(false)}
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

      {/* MODAL: DELETE CONFIRMATION (Owner Only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 bg-[var(--bg-surface)] border border-red-900/50 space-y-4 rounded-[2px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400 font-semibold block">
                Director Confirmation
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                Permanently Delete Lead?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
                Are you sure you want to delete the enquiry record for{" "}
                <strong className="text-[var(--text-primary)]">{lead.name}</strong>?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
