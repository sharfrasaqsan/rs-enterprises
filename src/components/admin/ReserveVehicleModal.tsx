"use client";

import React, { useState } from "react";
import { Vehicle } from "@/types/vehicle";
import { reserveVehicleAction } from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { formatPhoneDisplay } from "@/lib/phone";

interface ReserveVehicleModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedVehicle: Vehicle) => void;
}

interface ReserveVehicleModalInnerProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess: (updatedVehicle: Vehicle) => void;
}

function ReserveVehicleModalInner({
  vehicle,
  onClose,
  onSuccess,
}: ReserveVehicleModalInnerProps) {
  const { user } = useAdminAuth();

  // Lazy state initialization from vehicle props (no useEffect needed, zero cascading renders)
  const [depositDate, setDepositDate] = useState<string>(() => {
    return vehicle.reservation?.depositDate || new Date().toISOString().split("T")[0] || "";
  });

  const [holdExpiryDate, setHoldExpiryDate] = useState<string>(() => {
    if (vehicle.reservation?.holdExpiryDate) {
      try {
        const exp = new Date(vehicle.reservation.holdExpiryDate);
        return new Date(exp.getTime() - exp.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return "";
      }
    }
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    defaultExpiry.setHours(18, 0, 0, 0);
    return new Date(defaultExpiry.getTime() - defaultExpiry.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  const [depositAmount, setDepositAmount] = useState<string>(() => {
    if (vehicle.reservation?.depositAmount) {
      return String(vehicle.reservation.depositAmount);
    }
    if (vehicle.price) {
      return String(Math.round(vehicle.price * 0.05));
    }
    return "500000";
  });

  const [customerName, setCustomerName] = useState<string>(
    () => vehicle.reservation?.customerName || ""
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    () => vehicle.reservation?.customerPhone || ""
  );
  const [notes, setNotes] = useState<string>(
    () => vehicle.reservation?.notes || ""
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pure reference timestamp captured on mount
  const [mountTimeMs] = useState<number>(() => Date.now());

  // Preset hold durations
  function applyHoldPreset(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(18, 0, 0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setHoldExpiryDate(iso);
  }

  // Preset deposit amounts
  function applyDepositPreset(amount: number) {
    setDepositAmount(String(amount));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numAmount = parseFloat(depositAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid deposit amount (e.g. LKR 500,000).");
      return;
    }

    if (!depositDate) {
      setError("Please select the date the deposit was received.");
      return;
    }

    if (!holdExpiryDate) {
      setError("Please specify the hold expiry date and time.");
      return;
    }

    // Convert local datetime to ISO string
    let isoExpiry = holdExpiryDate;
    try {
      isoExpiry = new Date(holdExpiryDate).toISOString();
    } catch {
      // fallback
    }

    setIsSubmitting(true);
    setError(null);

    const res = await reserveVehicleAction({
      vehicleId: vehicle.id,
      depositAmount: numAmount,
      depositDate,
      holdExpiryDate: isoExpiry,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      reservedBy: user?.displayName || "Showroom Staff",
    });

    setIsSubmitting(false);

    if (res.success && res.vehicle) {
      onSuccess(res.vehicle);
      onClose();
    } else {
      setError(res.error || "Failed to confirm reservation.");
    }
  }

  const formattedVehiclePrice = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on Call";

  // Calculate live hold status preview using mountTimeMs (strictly pure during render)
  let expiryPreviewText = "";
  let isExpiryPast = false;
  if (holdExpiryDate) {
    const expTime = new Date(holdExpiryDate).getTime();
    const diffMs = expTime - mountTimeMs;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs <= 0) {
      isExpiryPast = true;
      expiryPreviewText = "Hold will be immediately marked EXPIRED upon saving.";
    } else {
      expiryPreviewText = `Hold active for ${diffDays} day${diffDays === 1 ? "" : "s"}. Expiry alerts trigger on ${new Date(holdExpiryDate).toLocaleDateString("en-LK", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.`;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-6 sm:p-8 my-8 text-[var(--text-primary)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pb-4 border-b border-[var(--border-hairline)]">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] block">
            Showroom Inventory Action
          </span>
          <h2 id="reserve-modal-title" className="font-serif text-2xl sm:text-3xl font-medium">
            Reserve Vehicle & Deposit Note
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Record customer advance payment, place a formal hold on showroom stock, and configure expiry alerts.
          </p>
        </div>

        {/* Vehicle Summary Card */}
        <div className="my-4 p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-serif text-lg text-[var(--text-primary)] font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)] font-mono">
              <span>{vehicle.grade}</span>
              <span>&bull;</span>
              <span>{vehicle.color}</span>
              {vehicle.chassisNumber && (
                <>
                  <span>&bull;</span>
                  <span className="text-amber-400">VIN: {vehicle.chassisNumber}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block">
              Listed Price
            </span>
            <span className="font-mono text-base font-semibold text-[var(--accent)]">
              {formattedVehiclePrice}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 badge-status-danger text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Deposit Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="deposit-amount" className="block text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                Deposit Amount (LKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-mono text-[var(--text-secondary)]">
                  LKR
                </span>
                <input
                  id="deposit-amount"
                  type="text"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="500,000"
                  className="w-full h-11 pl-12 pr-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[250000, 500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => applyDepositPreset(amt)}
                    className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                  </button>
                ))}
                {vehicle.price && (
                  <button
                    type="button"
                    onClick={() => applyDepositPreset(Math.round(vehicle.price! * 0.1))}
                    className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    10% ({(Math.round(vehicle.price * 0.1) / 1000000).toFixed(1)}M)
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deposit-date" className="block text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                Deposit Received Date *
              </label>
              <input
                id="deposit-date"
                type="date"
                required
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
              <p className="text-[10px] text-[var(--text-secondary)] font-light">
                Date funds entered RS Enterprises bank account or showroom cash counter.
              </p>
            </div>
          </div>

          {/* Section 2: Hold Expiry Date & Presets */}
          <div className="space-y-2 p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="hold-expiry" className="text-xs font-sans uppercase font-medium tracking-wider text-[var(--accent)]">
                Hold Expiry Date & Time *
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">Duration:</span>
                <button
                  type="button"
                  onClick={() => applyHoldPreset(3)}
                  className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                >
                  3 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyHoldPreset(7)}
                  className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyHoldPreset(14)}
                  className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                >
                  14 Days
                </button>
              </div>
            </div>

            <input
              id="hold-expiry"
              type="datetime-local"
              required
              value={holdExpiryDate}
              onChange={(e) => setHoldExpiryDate(e.target.value)}
              className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />

            {expiryPreviewText && (
              <div className={`p-2 text-[11px] rounded-[1px] flex items-center gap-2 font-medium ${
                isExpiryPast
                  ? "badge-status-danger"
                  : "badge-status-warning"
              }`}>
                <span>{isExpiryPast ? "⚠️" : "🔔"}</span>
                <span>{expiryPreviewText}</span>
              </div>
            )}
          </div>

          {/* Section 3: Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="customer-name" className="block text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                Customer / Buyer Full Name
              </label>
              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Dr. K. Jayasundara"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="customer-phone" className="block text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                Customer Phone (Sri Lanka)
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="077 123 4567"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
              {customerPhone && (
                <p className="text-[10px] font-mono text-[var(--accent)]">
                  Normalized: {formatPhoneDisplay(customerPhone)}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Deposit Note & Payment Reference */}
          <div className="space-y-1.5">
            <label htmlFor="deposit-notes" className="block text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)]">
              Deposit Note / Bank Slip / Receipt Reference
            </label>
            <textarea
              id="deposit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Commercial Bank online transfer ref #CB-9821. Customer finalizing vehicle lease with BOC Polonnaruwa. Balance due upon registration."
              className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
            <p className="text-[10px] text-[var(--text-secondary)] font-light">
              This note is permanently recorded in the vehicle audit trail and links to the customer&apos;s showroom CRM record.
            </p>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Recording Hold...</span>
                </div>
              ) : (
                <span>Confirm Reservation & Hold</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReserveVehicleModal(props: ReserveVehicleModalProps) {
  if (!props.isOpen || !props.vehicle) return null;

  return (
    <ReserveVehicleModalInner
      key={props.vehicle.id}
      vehicle={props.vehicle}
      onClose={props.onClose}
      onSuccess={props.onSuccess}
    />
  );
}
