"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Vehicle, VehicleStatus, formatBodyType, formatBranch } from "@/types/vehicle";
import {
  toggleVehiclePublishedAction,
  updateVehicleStatusAction,
  archiveVehicleAction,
  unarchiveVehicleAction,
} from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { VehicleImage } from "@/components/ui/VehicleImage";

export function VehiclesManagerClient({
  initialVehicles,
}: {
  initialVehicles: Vehicle[];
}) {
  const { user } = useAdminAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [viewTab, setViewTab] = useState<"active" | "archived">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [bodyFilter, setBodyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const activeVehicles = vehicles.filter((v) => !v.archived);
  const archivedVehicles = vehicles.filter((v) => Boolean(v.archived));

  const targetList = viewTab === "active" ? activeVehicles : archivedVehicles;

  // In-memory filter
  const filteredVehicles = targetList.filter((v) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (branchFilter !== "all" && v.branch !== branchFilter) return false;
    if (bodyFilter !== "all" && v.bodyType !== bodyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        v.grade.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q) ||
        (v.chassisNumber && v.chassisNumber.toLowerCase().includes(q)) ||
        (v.bodyType && v.bodyType.toLowerCase().includes(q)) ||
        (v.branch && v.branch.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  async function handleTogglePublished(vehicleId: string, current: boolean) {
    setLoadingId(vehicleId);
    const nextVal = !current;
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await toggleVehiclePublishedAction(vehicleId, nextVal, updatedBy);
    setLoadingId(null);
    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, published: nextVal, updatedAt: new Date().toISOString(), updatedBy }
            : v
        )
      );
    }
  }

  async function handleStatusChange(vehicleId: string, newStatus: VehicleStatus) {
    setLoadingId(vehicleId);
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await updateVehicleStatusAction(vehicleId, newStatus, undefined, updatedBy);
    setLoadingId(null);
    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status: newStatus, updatedAt: new Date().toISOString(), updatedBy }
            : v
        )
      );
    }
  }

  async function handleArchiveVehicle(vehicleId: string) {
    setLoadingId(vehicleId);
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await archiveVehicleAction(vehicleId, updatedBy);
    setLoadingId(null);
    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, archived: true, published: false, updatedAt: new Date().toISOString(), updatedBy }
            : v
        )
      );
      setArchiveConfirmId(null);
    }
  }

  async function handleRestoreVehicle(vehicleId: string) {
    setLoadingId(vehicleId);
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await unarchiveVehicleAction(vehicleId, updatedBy);
    setLoadingId(null);
    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, archived: false, updatedAt: new Date().toISOString(), updatedBy }
            : v
        )
      );
    }
  }

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-LK", {
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
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Showroom Fleet</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Vehicle Inventory
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Control showroom stock availability, live website publication, and audit history
          </p>
        </div>

        <Link
          href="/admin/vehicles/new"
          className="min-h-[44px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm self-start sm:self-auto"
        >
          + Add New Vehicle
        </Link>
      </div>

      {/* Tabs: Active vs Archived */}
      <div className="flex items-center gap-4 border-b border-[var(--border-hairline)] pb-2">
        <button
          type="button"
          onClick={() => setViewTab("active")}
          className={`min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider transition-colors border-b-2 cursor-pointer ${
            viewTab === "active"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Active Showroom Fleet ({activeVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => setViewTab("archived")}
          className={`min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider transition-colors border-b-2 cursor-pointer ${
            viewTab === "archived"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Archived Fleet ({archivedVehicles.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by make, model, VIN / chassis, color..."
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Showroom Branches</option>
            <option value="polonnaruwa">Kaduruwela Main Showroom</option>
            <option value="trincomalee">Trincomalee Branch</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={bodyFilter}
            onChange={(e) => setBodyFilter(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Bodies</option>
            <option value="suv">SUV</option>
            <option value="sedan">Sedan</option>
            <option value="hatchback">Hatchback</option>
            <option value="mpv">MPV / Van</option>
            <option value="crossover">Crossover</option>
            <option value="wagon">Wagon</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Statuses ({targetList.length})</option>
            <option value="available">
              Available ({targetList.filter((v) => v.status === "available").length})
            </option>
            <option value="incoming">
              Incoming ({targetList.filter((v) => v.status === "incoming").length})
            </option>
            <option value="reserved">
              Reserved ({targetList.filter((v) => v.status === "reserved").length})
            </option>
            <option value="sold">
              Sold ({targetList.filter((v) => v.status === "sold").length})
            </option>
          </select>
        </div>
      </div>

      {/* Vehicles Inventory List */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <p className="font-serif text-xl text-[var(--text-primary)]">
            No {viewTab === "active" ? "active" : "archived"} vehicles match your search
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Try adjusting your keyword filter or adding a new vehicle to the showroom fleet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {filteredVehicles.map((vehicle) => {
            const isUpdating = loadingId === vehicle.id;
            const formattedPrice = vehicle.price
              ? `LKR ${vehicle.price.toLocaleString("en-US")}`
              : "Price on Call";

            return (
              <div
                key={vehicle.id}
                className={`p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-opacity ${
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Vehicle Thumbnail + Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-24 sm:w-32 shrink-0">
                    <VehicleImage
                      src={vehicle.images[0] || "/images/vehicles/sample-prado.svg"}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      aspectRatio="16/10"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                        {vehicle.grade}
                      </span>
                      {vehicle.chassisNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 uppercase rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/30" title="Chassis / VIN (Admin Only)">
                          VIN: {vehicle.chassisNumber}
                        </span>
                      )}
                      {vehicle.archived ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 uppercase rounded-[2px] bg-red-950/30 text-red-400 border border-red-800">
                          Archived
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 uppercase rounded-[2px] ${
                            vehicle.published
                              ? "bg-green-950/30 text-green-400 border border-green-800"
                              : "bg-amber-950/30 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {vehicle.published ? "Live on Site" : "Hidden Draft"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--accent)] font-medium">
                        {formatBranch(vehicle.branch)}
                      </span>
                      <span>&bull;</span>
                      <span>{formatBodyType(vehicle.bodyType)}</span>
                      <span>&bull;</span>
                      <span>{vehicle.driveType}</span>
                      <span>&bull;</span>
                      <span>{vehicle.seats} Seats</span>
                      <span>&bull;</span>
                      <span className={vehicle.registrationStatus === "unregistered" ? "text-emerald-400" : ""}>
                        {vehicle.registrationStatus === "unregistered" ? "Unregistered" : `Registered (${vehicle.owners} Owner)`}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-[var(--text-primary)]">
                        Grade {vehicle.auctionGrade} ({vehicle.auctionScore})
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] font-light">
                      {vehicle.mileage.toLocaleString("en-US")} KM &bull; {vehicle.fuel} &bull;{" "}
                      {vehicle.transmission} &bull; {vehicle.color}
                    </p>

                    <div className="flex items-center gap-4 pt-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                        {formattedPrice}
                      </span>

                      {/* Last updated audit info */}
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                        Updated: {formatDateTime(vehicle.updatedAt)} by {vehicle.updatedBy || "Staff"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Management Controls */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border-hairline)]">
                  {!vehicle.archived ? (
                    <>
                      {/* Status Dropdown */}
                      <div>
                        <label
                          htmlFor={`status-select-${vehicle.id}`}
                          className="sr-only"
                        >
                          Status
                        </label>
                        <select
                          id={`status-select-${vehicle.id}`}
                          value={vehicle.status}
                          onChange={(e) =>
                            handleStatusChange(vehicle.id, e.target.value as VehicleStatus)
                          }
                          className="h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                        >
                          <option value="available">Available (Showroom)</option>
                          <option value="incoming">Incoming (In-Transit)</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>

                      {/* 1-Tap Show on Website Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(vehicle.id, vehicle.published)}
                        className={`min-h-[44px] px-3.5 text-xs font-sans uppercase font-medium tracking-wider border rounded-[2px] transition-colors cursor-pointer ${
                          vehicle.published
                            ? "border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-amber-700 hover:text-amber-400"
                            : "border-green-800 bg-green-950/20 text-green-300 hover:bg-green-950/40"
                        }`}
                      >
                        {vehicle.published ? "Hide from Site" : "Show on Website"}
                      </button>

                      {/* Edit Details */}
                      <Link
                        href={`/admin/vehicles/${vehicle.id}/edit`}
                        className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      >
                        Edit
                      </Link>

                      {/* Social Poster Kit */}
                      <Link
                        href={`/admin/vehicles/${vehicle.id}/edit#marketing`}
                        className="min-h-[44px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                        title="Generate branded square & story posters with captions"
                      >
                        Poster
                      </Link>

                      {/* Live Public View */}
                      <Link
                        href={`/vehicles/${vehicle.slug}`}
                        target="_blank"
                        className="min-h-[44px] px-3 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="View live dossier on public site"
                      >
                        Live &rarr;
                      </Link>

                      {/* Archive with confirmation */}
                      {archiveConfirmId === vehicle.id ? (
                        <div className="flex items-center gap-1.5 p-1 bg-amber-950/20 border border-amber-800 rounded-[2px]">
                          <span className="text-[10px] text-amber-300 font-sans px-1">
                            Archive vehicle?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleArchiveVehicle(vehicle.id)}
                            className="min-h-[38px] px-2.5 bg-amber-700 text-white text-[10px] font-sans uppercase tracking-wider hover:bg-amber-600 rounded-[2px]"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveConfirmId(null)}
                            className="min-h-[38px] px-2 text-[10px] uppercase text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setArchiveConfirmId(vehicle.id)}
                          className="min-h-[44px] px-2.5 text-xs uppercase tracking-wider text-[var(--text-secondary)] hover:text-amber-400 transition-colors cursor-pointer"
                          title="Archive vehicle (unlists from website, preserves CRM records)"
                        >
                          Archive
                        </button>
                      )}
                    </>
                  ) : (
                    /* Archived view actions */
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-secondary)] italic">
                        Archived from public catalog
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRestoreVehicle(vehicle.id)}
                        className="min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
                      >
                        Restore to Draft
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
