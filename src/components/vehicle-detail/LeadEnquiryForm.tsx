"use client";

import React, { useState, useTransition } from "react";
import { createLeadAction, CreateLeadResult } from "@/app/actions/leads";

export function LeadEnquiryForm({
  vehicleId = "general-inquiry",
  vehicleTitle = "General Showroom Inquiry",
}: {
  vehicleId?: string;
  vehicleTitle?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateLeadResult | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createLeadAction(formData);
      setResult(res);
    });
  };

  if (result?.success) {
    return (
      <div className="p-6 bg-[var(--bg-surface)] border border-[var(--accent)] rounded-[2px] space-y-3 animate-in fade-in">
        <div className="flex items-center space-x-2 text-[var(--accent)]">
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-sans text-xs uppercase font-semibold tracking-wider">
            Inquiry Registered
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
          {result.message}
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--accent)] hover:underline pt-2 cursor-pointer"
        >
          Submit Another Request &rarr;
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-4 text-xs font-sans"
    >
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="vehicleTitle" value={vehicleTitle} />

      {/* Honeypot Anti-Spam (Hidden from real users) */}
      <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
        <input
          type="text"
          name="_hp_verify"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="space-y-1">
        <span className="font-serif text-base text-[var(--text-primary)] block">
          Showroom Inquiry Desk
        </span>
        <p className="text-[11px] text-[var(--text-secondary)] font-light">
          Request the full Japanese auction inspection sheet or schedule a viewing.
        </p>
      </div>

      {result?.error && (
        <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-300 text-xs rounded-[1px]">
          {result.error}
        </div>
      )}

      {/* Name Input */}
      <div className="space-y-1">
        <label htmlFor="lead-name" className="block uppercase tracking-wider text-[var(--text-muted)] font-medium text-[10px]">
          Full Name *
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Kasun Perera"
          className="w-full min-h-[44px] px-3.5 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
      </div>

      {/* Phone Input */}
      <div className="space-y-1">
        <label htmlFor="lead-phone" className="block uppercase tracking-wider text-[var(--text-muted)] font-medium text-[10px]">
          Phone / WhatsApp Number *
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          required
          placeholder="+94 77 XXX XXXX"
          className="w-full min-h-[44px] px-3.5 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors tabular-nums"
        />
      </div>

      {/* Email Input (Optional) */}
      <div className="space-y-1">
        <label htmlFor="lead-email" className="block uppercase tracking-wider text-[var(--text-muted)] font-medium text-[10px]">
          Email Address (Optional)
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          placeholder="name@domain.com"
          className="w-full min-h-[44px] px-3.5 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
      </div>

      {/* Branch Preference */}
      <div className="space-y-1">
        <label htmlFor="lead-branch" className="block uppercase tracking-wider text-[var(--text-muted)] font-medium text-[10px]">
          Preferred Showroom
        </label>
        <select
          id="lead-branch"
          name="branch"
          defaultValue="polonnaruwa"
          className="w-full min-h-[44px] px-3.5 py-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors uppercase tracking-wider"
        >
          <option value="polonnaruwa">Kaduruwela Main Showroom (Polonnaruwa)</option>
          <option value="trincomalee">Trincomalee Coastal Showroom</option>
        </select>
      </div>

      {/* Note / Questions */}
      <div className="space-y-1">
        <label htmlFor="lead-notes" className="block uppercase tracking-wider text-[var(--text-muted)] font-medium text-[10px]">
          Message or Specific Questions
        </label>
        <textarea
          id="lead-notes"
          name="requestDetails"
          rows={3}
          placeholder="e.g. Please share auction sheet, or inquiry regarding lease facilities."
          className="w-full p-3 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors text-xs"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[48px] px-6 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-xs uppercase font-medium tracking-[0.18em] transition-luxury flex items-center justify-center cursor-pointer select-none disabled:opacity-50"
      >
        {isPending ? "Submitting Inquiry..." : "Submit Showroom Inquiry"}
      </button>
    </form>
  );
}

