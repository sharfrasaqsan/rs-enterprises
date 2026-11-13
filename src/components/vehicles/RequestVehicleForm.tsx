"use client";

import React, { useState } from "react";
import { createLeadAction, CreateLeadResult } from "@/app/actions/leads";

export function RequestVehicleForm() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<CreateLeadResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const makeModel = formData.get("makeModel")?.toString().trim() || "";
    const yearRange = formData.get("yearRange")?.toString().trim() || "";
    const budget = formData.get("budget")?.toString().trim() || "";
    const fuel = formData.get("fuel")?.toString().trim() || "";
    const colorGrade = formData.get("colorGrade")?.toString().trim() || "";
    const branch = formData.get("branch")?.toString().trim() || "polonnaruwa";
    const notes = formData.get("notes")?.toString().trim() || "";

    const fullSpecs = `[CUSTOM JAPAN VEHICLE REQUEST] Model: ${makeModel} | Year: ${yearRange} | Budget: ${budget} | Fuel: ${fuel} | Color/Grade: ${colorGrade} | Preferred Delivery Branch: ${branch} | Notes: ${notes}`;

    const submissionData = new FormData();
    submissionData.append("name", formData.get("name")?.toString().trim() || "");
    submissionData.append("phone", formData.get("phone")?.toString().trim() || "");
    submissionData.append("email", formData.get("email")?.toString().trim() || "");
    submissionData.append("branch", branch);
    submissionData.append("source", "vehicle_request");
    submissionData.append("vehicleTitle", `Direct Import Request: ${makeModel}`);
    submissionData.append("requestDetails", fullSpecs);
    submissionData.append("initialNote", fullSpecs);
    submissionData.append("_hp_verify", formData.get("_hp_verify")?.toString() || "");

    try {
      const res = await createLeadAction(submissionData);
      setResult(res);
      if (res.success) {
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      setResult({
        success: false,
        error: "Network error occurred. Please contact our import desk directly.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field */}
      <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
        <input
          type="text"
          name="_hp_verify"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {result?.success ? (
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--accent)] text-xs text-[var(--text-primary)] space-y-2">
          <p className="font-serif text-lg text-[var(--accent)]">Request Confirmed</p>
          <p className="font-light leading-relaxed">
            {result.message ||
              "Your vehicle request has been assigned to our Tokyo auction sourcing desk. We will review upcoming catalog listings and contact you with matching vehicles and CIF estimates."}
          </p>
        </div>
      ) : null}

      {result?.error ? (
        <div className="p-4 bg-red-950/20 border border-red-800 text-xs text-red-300">
          {result.error}
        </div>
      ) : null}

      {/* Grid 1: Desired Vehicle Specs */}
      <div className="space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block">
          01. Vehicle Specifications
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-makemodel"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Desired Make &amp; Model *
            </label>
            <input
              id="req-makemodel"
              name="makeModel"
              type="text"
              required
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Toyota Land Cruiser Prado / Vezel"
            />
          </div>

          <div>
            <label
              htmlFor="req-year"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Year Range *
            </label>
            <input
              id="req-year"
              name="yearRange"
              type="text"
              required
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. 2021 – 2024"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="req-budget"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Estimated Budget (LKR)
            </label>
            <input
              id="req-budget"
              name="budget"
              type="text"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. 35 - 45 Million"
            />
          </div>

          <div>
            <label
              htmlFor="req-fuel"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Fuel Type
            </label>
            <select
              id="req-fuel"
              name="fuel"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="Hybrid">Hybrid / e-Power</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel / Turbo Diesel</option>
              <option value="Electric">Electric (EV)</option>
              <option value="Any">Any Fuel Type</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="req-colorgrade"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Preferred Color / Package
            </label>
            <input
              id="req-colorgrade"
              name="colorGrade"
              type="text"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Pearl White, Sunroof, ZX Grade"
            />
          </div>
        </div>
      </div>

      {/* Grid 2: Contact & Delivery Info */}
      <div className="space-y-4 pt-2 border-t border-[var(--border-hairline)]">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block">
          02. Contact &amp; Handover Preference
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-name"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Your Full Name *
            </label>
            <input
              id="req-name"
              name="name"
              type="text"
              required
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Bandara Jayasinghe"
            />
          </div>

          <div>
            <label
              htmlFor="req-phone"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Telephone / WhatsApp *
            </label>
            <input
              id="req-phone"
              name="phone"
              type="tel"
              required
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. 077 555 8899"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-email"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Email Address (Optional)
            </label>
            <input
              id="req-email"
              name="email"
              type="email"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. bandara@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="req-branch"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Preferred Handover Showroom
            </label>
            <select
              id="req-branch"
              name="branch"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="polonnaruwa">Kaduruwela Main Showroom (Polonnaruwa)</option>
              <option value="trincomalee">Trincomalee Coastal Branch</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="req-notes"
            className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
          >
            Specific Features or Notes
          </label>
          <textarea
            id="req-notes"
            name="notes"
            rows={3}
            className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] resize-none"
            placeholder="e.g. Must have Modellista body kit, 360-degree camera, beige leather interior, mileage below 30,000 km."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.2em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
      >
        {isPending ? "Connecting to Tokyo Auction Desk..." : "Submit Vehicle Request"}
      </button>
    </form>
  );
}

