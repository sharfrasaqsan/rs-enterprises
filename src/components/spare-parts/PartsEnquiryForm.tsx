"use client";

import React, { useState } from "react";
import { createLeadAction, CreateLeadResult } from "@/app/actions/leads";

export function PartsEnquiryForm() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<CreateLeadResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const partName = formData.get("partName")?.toString() || "";
    const vehicleInfo = formData.get("vehicleInfo")?.toString() || "";
    const chassisNo = formData.get("chassisNo")?.toString() || "";
    const branch = formData.get("branch")?.toString() || "polonnaruwa";
    const details = formData.get("details")?.toString() || "";

    const combinedDetails = `[SPARE PARTS INQUIRY] Part: ${partName} | Vehicle: ${vehicleInfo} | Chassis/Frame No: ${chassisNo} | Preferred Delivery/Branch: ${branch} | Notes: ${details}`;

    const submissionData = new FormData();
    submissionData.append("name", formData.get("name")?.toString() || "");
    submissionData.append("phone", formData.get("phone")?.toString() || "");
    submissionData.append("email", formData.get("email")?.toString() || "");
    submissionData.append("branch", branch);
    submissionData.append("vehicleTitle", `Spare Part: ${partName} (${vehicleInfo})`);
    submissionData.append("requestDetails", combinedDetails);
    submissionData.append("initialNote", combinedDetails);
    // Honeypot field
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
        error: "Network error occurred. Please contact our parts hotline directly.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--accent)] text-xs text-[var(--text-primary)] space-y-2">
          <p className="font-semibold text-[var(--accent)]">Parts Inquiry Registered</p>
          <p className="font-light leading-relaxed">
            {result.message || "Our spare parts counter in Kaduruwela will check Japanese inventory and notify you of availability and price."}
          </p>
        </div>
      ) : null}

      {result?.error ? (
        <div className="p-3 bg-red-950/20 border border-red-800 text-xs text-red-300">
          {result.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="parts-name"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Your Full Name *
          </label>
          <input
            id="parts-name"
            name="name"
            type="text"
            required
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            placeholder="e.g. Priyantha Perera"
          />
        </div>

        <div>
          <label
            htmlFor="parts-phone"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Telephone / WhatsApp *
          </label>
          <input
            id="parts-phone"
            name="phone"
            type="tel"
            required
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            placeholder="e.g. 077 123 4567"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="parts-vehicle"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Vehicle Make, Model & Year *
          </label>
          <input
            id="parts-vehicle"
            name="vehicleInfo"
            type="text"
            required
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            placeholder="e.g. Toyota Prado TX-L 2020"
          />
        </div>

        <div>
          <label
            htmlFor="parts-chassis"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Chassis / Frame Number (VIN)
          </label>
          <input
            id="parts-chassis"
            name="chassisNo"
            type="text"
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            placeholder="e.g. GDJ150-0012345"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="parts-partname"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Part Required / Part Number *
          </label>
          <input
            id="parts-partname"
            name="partName"
            type="text"
            required
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            placeholder="e.g. Front Shock Absorbers / Brake Pads"
          />
        </div>

        <div>
          <label
            htmlFor="parts-branch"
            className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
          >
            Collection / Delivery Location
          </label>
          <select
            id="parts-branch"
            name="branch"
            className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="polonnaruwa">Kaduruwela Main Counter (Polonnaruwa)</option>
            <option value="trincomalee">Trincomalee Counter</option>
            <option value="polonnaruwa">Island-wide Courier Delivery</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="parts-details"
          className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
        >
          Additional Details or Symptoms
        </label>
        <textarea
          id="parts-details"
          name="details"
          rows={3}
          className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="Specify whether you need Genuine OEM (Japan), Denso, Tokico, or high-grade Japanese aftermarket replacement."
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.18em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
      >
        {isPending ? "Checking Inventory..." : "Submit Parts Inquiry"}
      </button>
    </form>
  );
}

