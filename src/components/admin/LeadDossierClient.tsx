"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lead, LeadStage } from "@/types/lead";
import {
  updateLeadStageAction,
  addLeadNoteAction,
  setLeadFollowUpAction,
} from "@/app/actions/admin";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function LeadDossierClient({ initialLead }: { initialLead: Lead }) {
  const [lead, setLead] = useState<Lead>(initialLead);
  const [noteText, setNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate || "");
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${encodeURIComponent(
    `Hello ${lead.name}, RS Enterprises Kaduruwela showroom following up regarding ${lead.vehicleTitle || "your Japanese vehicle inquiry"}.`
  )}`;

  async function handleStageChange(newStage: LeadStage) {
    if (newStage === "lost") {
      setShowLostModal(true);
      return;
    }
    const res = await updateLeadStageAction(lead.id, newStage);
    if (res.success) {
      setLead((prev) => ({ ...prev, stage: newStage }));
    }
  }

  async function handleConfirmLost() {
    const res = await updateLeadStageAction(lead.id, "lost", lostReason);
    if (res.success) {
      setLead((prev) => ({ ...prev, stage: "lost", lostReason }));
      setShowLostModal(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsSubmittingNote(true);
    const res = await addLeadNoteAction(lead.id, noteText.trim());
    setIsSubmittingNote(false);
    if (res.success) {
      const newNote = {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        author: "Staff Member",
        time: new Date().toISOString(),
      };
      setLead((prev) => ({
        ...prev,
        notes: [...prev.notes, newNote],
      }));
      setNoteText("");
    }
  }

  async function handleSaveFollowUp() {
    setIsSavingFollowUp(true);
    const res = await setLeadFollowUpAction(lead.id, followUpDate);
    setIsSavingFollowUp(false);
    if (res.success) {
      setLead((prev) => ({ ...prev, followUpDate }));
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/admin/leads"
          className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
        >
          &larr; Back to All Leads Pipeline
        </Link>
      </div>

      {/* Header Profile */}
      <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
              Stage: {lead.stage}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
              Branch: {lead.branch}
            </span>
            <span className="text-[10px] font-sans text-[var(--text-secondary)]">
              Channel: {lead.source.replace("_", " ")}
            </span>
          </div>

          <Heading level={1} className="text-3xl sm:text-4xl">
            {lead.name}
          </Heading>

          <p className="font-mono text-sm text-[var(--text-secondary)]">
            {lead.phone} {lead.email ? `• ${lead.email}` : ""}
          </p>
        </div>

        {/* 1-Tap Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
          >
            Direct Call
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            WhatsApp Customer
          </a>
        </div>
      </div>

      {/* Grid: Details & Follow-up (Left 7 cols) + Stage Switcher & Notes (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Vehicle & Follow-Up Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vehicle of Interest Card */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
            <Eyebrow>Vehicle Interest</Eyebrow>
            <h3 className="font-serif text-xl text-[var(--text-primary)]">
              {lead.vehicleTitle || "General Showroom Inquiry"}
            </h3>
            {lead.requestDetails && (
              <div className="pt-2 border-t border-[var(--border-hairline)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block mb-1">
                  Customer Specifications
                </span>
                <p className="text-xs font-light text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                  {lead.requestDetails}
                </p>
              </div>
            )}
          </div>

          {/* Stage Controller */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
            <Eyebrow>Sales Stage Control</Eyebrow>
            <label
              htmlFor="lead-stage-select"
              className="block text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)]"
            >
              Current Status
            </label>
            <select
              id="lead-stage-select"
              value={lead.stage}
              onChange={(e) => handleStageChange(e.target.value as LeadStage)}
              className="w-full h-12 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="new">New (Uncontacted)</option>
              <option value="contacted">Contacted (Spoken / Messaged)</option>
              <option value="viewing">Showroom Viewing Scheduled</option>
              <option value="negotiating">Negotiating / Price Discussion</option>
              <option value="won">Won (Vehicle Sold &amp; Handed Over)</option>
              <option value="lost">Lost (Closed Inquiry)</option>
            </select>

            {lead.lostReason && (
              <div className="p-3 bg-red-950/20 border border-red-800 text-xs text-red-300">
                Lost Reason: {lead.lostReason}
              </div>
            )}
          </div>

          {/* Scheduled Follow-Up */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
            <Eyebrow>Next Action Reminder</Eyebrow>
            <div>
              <label
                htmlFor="lead-followup-date"
                className="block text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1"
              >
                Follow-Up Due Date
              </label>
              <div className="flex gap-2">
                <input
                  id="lead-followup-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="flex-1 h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  disabled={isSavingFollowUp}
                  onClick={handleSaveFollowUp}
                  className="min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingFollowUp ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Notes History Thread & Add Note */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <Eyebrow>Interaction History</Eyebrow>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                {lead.notes?.length || 0} notes
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
                placeholder="Log phone discussion, customer preferences, CIF quotation offered, or trade-in remarks..."
                className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteText.trim()}
                className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingNote ? "Saving Note..." : "Add Note to File"}
              </button>
            </form>

            {/* Chronological Thread */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
              {!lead.notes || lead.notes.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] font-light italic">
                  No notes logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {[...lead.notes].reverse().map((note) => {
                    const formattedDate = new Date(note.time).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });
                    return (
                      <div
                        key={note.id}
                        className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-mono">
                          <span className="text-[var(--accent)] font-medium">
                            {note.author}
                          </span>
                          <span>{formattedDate}</span>
                        </div>
                        <p className="text-xs font-light text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                          {note.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
            <h4 className="font-serif text-xl text-[var(--text-primary)]">
              Mark Inquiry as Lost
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Please specify why this customer inquiry was closed to maintain accurate showroom sales analytics.
            </p>

            <div className="space-y-2">
              {[
                "Purchased another brand/vehicle elsewhere",
                "Price or import duty higher than budget",
                "Vehicle model unavailable at Japanese auctions",
                "Customer unresponsive after multiple follow-ups",
                "Postponed purchase decision",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setLostReason(reason)}
                  className={`w-full min-h-[44px] px-3 text-left text-xs rounded-[2px] border transition-colors ${
                    lostReason === reason
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                      : "border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-secondary)]"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="min-h-[44px] px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLost}
                className="min-h-[44px] px-5 text-xs uppercase tracking-wider bg-red-900 text-white hover:bg-red-800"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

