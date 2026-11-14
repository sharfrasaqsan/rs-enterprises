"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Vehicle,
  ImportStage,
  IMPORT_STAGES,
  normalizeImportStage,
  StandardImportStage,
} from "@/types/vehicle";
import { updateIncomingStageAction } from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { VehicleImage } from "@/components/ui/VehicleImage";

export function IncomingManagerClient({
  initialVehicles,
}: {
  initialVehicles: Vehicle[];
}) {
  const { user } = useAdminAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingEtaId, setEditingEtaId] = useState<string | null>(null);
  const [tempEta, setTempEta] = useState("");

  // Only incoming vehicles (or recently arrived)
  const incomingVehicles = vehicles.filter(
    (v) => v.status === "incoming" || v.importStage !== null
  );

  const filtered = incomingVehicles.filter((v) => {
    const std = normalizeImportStage(v.importStage);
    if (filterStage !== "all" && std !== filterStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        (v.expectedArrival || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const countPurchased = incomingVehicles.filter(
    (v) => normalizeImportStage(v.importStage) === "purchased"
  ).length;
  const countShipped = incomingVehicles.filter(
    (v) => normalizeImportStage(v.importStage) === "shipped"
  ).length;
  const countAtPort = incomingVehicles.filter(
    (v) => normalizeImportStage(v.importStage) === "at_port"
  ).length;
  const countClearing = incomingVehicles.filter(
    (v) => normalizeImportStage(v.importStage) === "clearing"
  ).length;
  const countReady = incomingVehicles.filter(
    (v) => normalizeImportStage(v.importStage) === "ready"
  ).length;

  async function handleSetStage(vehicle: Vehicle, nextStage: StandardImportStage) {
    setLoadingId(vehicle.id);
    const updatedBy = user?.displayName || "Showroom Logistics";
    const res = await updateIncomingStageAction(
      vehicle.id,
      nextStage,
      vehicle.expectedArrival,
      updatedBy
    );
    setLoadingId(null);

    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id
            ? {
                ...v,
                importStage: nextStage,
                status: nextStage === "ready" ? "available" : v.status,
                updatedAt: new Date().toISOString(),
                updatedBy,
              }
            : v
        )
      );
    }
  }

  async function handleSaveEta(vehicle: Vehicle) {
    setLoadingId(vehicle.id);
    const updatedBy = user?.displayName || "Showroom Logistics";
    const res = await updateIncomingStageAction(
      vehicle.id,
      vehicle.importStage,
      tempEta.trim() || null,
      updatedBy
    );
    setLoadingId(null);
    setEditingEtaId(null);

    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id
            ? {
                ...v,
                expectedArrival: tempEta.trim() || null,
                updatedAt: new Date().toISOString(),
                updatedBy,
              }
            : v
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Direct Japan Logistics</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Incoming Stock Pipeline
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Track vehicles across 5 stages: Purchased &rarr; Shipped &rarr; At port &rarr; Clearing &rarr; Ready
          </p>
        </div>

        <Link
          href="/admin/vehicles/new"
          className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm self-start sm:self-auto"
        >
          + Register Incoming Unit
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-amber-400 block">
            1. Purchased
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 block">
            {countPurchased}
          </span>
        </div>

        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-cyan-400 block">
            2. Shipped
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 block">
            {countShipped}
          </span>
        </div>

        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-indigo-400 block">
            3. At Port
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 block">
            {countAtPort}
          </span>
        </div>

        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-violet-400 block">
            4. Clearing
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 block">
            {countClearing}
          </span>
        </div>

        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] col-span-2 sm:col-span-1">
          <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-emerald-400 block">
            5. Ready (Stock)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 block">
            {countReady}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incoming units by make, model, year, or vessel ETA..."
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Stages ({incomingVehicles.length})</option>
            <option value="purchased">1. Purchased ({countPurchased})</option>
            <option value="shipped">2. Shipped ({countShipped})</option>
            <option value="at_port">3. At Port ({countAtPort})</option>
            <option value="clearing">4. Clearing ({countClearing})</option>
            <option value="ready">5. Ready ({countReady})</option>
          </select>
        </div>
      </div>

      {/* Vehicles Logistics List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <p className="font-serif text-xl text-[var(--text-primary)]">
            No incoming vehicles in this stage
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            All Japanese shipments are up to date or recorded in showroom inventory.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((vehicle) => {
            const isUpdating = loadingId === vehicle.id;
            const currentStage = normalizeImportStage(vehicle.importStage) || "purchased";

            return (
              <div
                key={vehicle.id}
                className={`p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5 transition-opacity ${
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Top Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 sm:w-28 shrink-0">
                      <VehicleImage
                        src={vehicle.images[0] || "/images/vehicles/sample-prado.svg"}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        aspectRatio="16/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-lg text-[var(--text-primary)] font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                          {vehicle.grade}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)]">
                          {vehicle.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-light">
                        {vehicle.engineCC} CC &bull; {vehicle.fuel} &bull; {vehicle.color}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-secondary)] pt-0.5">
                        Last updated by: {vehicle.updatedBy || "Logistics"}
                      </p>
                    </div>
                  </div>

                  {/* ETA & Quick Links */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {editingEtaId === vehicle.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempEta}
                          onChange={(e) => setTempEta(e.target.value)}
                          placeholder="e.g. Late March 2025"
                          className="h-9 px-2.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEta(vehicle)}
                          className="h-9 px-3 bg-[var(--accent)] text-white text-[10px] font-sans uppercase tracking-wider"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEtaId(null)}
                          className="h-9 px-2 text-[10px] uppercase text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] block">
                          Expected Arrival Month
                        </span>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
                            {vehicle.expectedArrival || "Date Pending"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEtaId(vehicle.id);
                              setTempEta(vehicle.expectedArrival || "");
                            }}
                            className="text-[10px] font-sans uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline min-h-[44px] inline-flex items-center"
                            title="Edit Arrival Month"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/admin/vehicles/${vehicle.id}/edit`}
                      className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                    >
                      Edit Unit
                    </Link>
                  </div>
                </div>

                {/* 5-Step Row of Steps */}
                <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)] block">
                      Import Logistics Stage:
                    </span>
                    <span className="text-[10px] font-sans text-[var(--text-secondary)]">
                      1-Tap updates live site and revalidates /incoming &amp; vehicle page
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {IMPORT_STAGES.map((stg) => {
                      const isCurrent = currentStage === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => handleSetStage(vehicle, stg.key)}
                          className={`min-h-[44px] p-2.5 text-left border rounded-[2px] transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                              : "bg-[var(--bg-base)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-sans uppercase font-semibold tracking-wider block">
                              {stg.stepNumber}. {stg.label}
                            </span>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-light leading-tight block mt-0.5 line-clamp-1 ${
                              isCurrent ? "text-white/80" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {stg.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

