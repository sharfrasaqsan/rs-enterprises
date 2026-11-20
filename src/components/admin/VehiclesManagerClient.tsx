"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Vehicle, VehicleStatus, formatBodyType, formatBranch, getHoldExpiryStatus } from "@/types/vehicle";
import {
  toggleVehiclePublishedAction,
  updateVehicleStatusAction,
  archiveVehicleAction,
  unarchiveVehicleAction,
  releaseVehicleReservationAction,
} from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { ReserveVehicleModal } from "./ReserveVehicleModal";
import { AdminPagination } from "./AdminPagination";
import { SocialPosterGenerator } from "./SocialPosterGenerator";
import { formatPhoneDisplay } from "@/lib/phone";

export function VehiclesManagerClient({
  initialVehicles,
}: {
  initialVehicles: Vehicle[];
}) {
  const { user } = useAdminAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [viewTab, setViewTab] = useState<"active" | "sold" | "archived">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [bodyFilter, setBodyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [reserveModalVehicle, setReserveModalVehicle] = useState<Vehicle | null>(null);
  const [posterModalVehicle, setPosterModalVehicle] = useState<Vehicle | null>(null);
  const [releaseConfirmId, setReleaseConfirmId] = useState<string | null>(null);

  // Split inventory strictly: Active Fleet (Available/Incoming/Reserved) vs Sold vs Archived
  const activeVehicles = vehicles.filter((v) => !v.archived && v.status !== "sold");
  const soldVehicles = vehicles.filter((v) => !v.archived && v.status === "sold");
  const archivedVehicles = vehicles.filter((v) => Boolean(v.archived));

  // Hold expiry alerts across fleet
  const reservedWithHolds = activeVehicles
    .filter((v) => v.status === "reserved" && v.reservation?.holdExpiryDate)
    .map((v) => ({
      vehicle: v,
      holdStatus: getHoldExpiryStatus(v.reservation?.holdExpiryDate),
    }));

  const expiredHolds = reservedWithHolds.filter((item) => item.holdStatus?.isExpired);
  const expiringSoonHolds = reservedWithHolds.filter((item) => item.holdStatus?.isExpiringSoon);

  const targetList =
    viewTab === "active"
      ? activeVehicles
      : viewTab === "sold"
      ? soldVehicles
      : archivedVehicles;

  function switchTab(newTab: "active" | "sold" | "archived") {
    setViewTab(newTab);
    setStatusFilter("all");
    setCurrentPage(1);
  }

  // In-memory filter
  const filteredVehicles = targetList.filter((v) => {
    if (viewTab === "active") {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
    }
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

  // Pagination calculation
  const totalItems = filteredVehicles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

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
    if (newStatus === "reserved") {
      const target = vehicles.find((v) => v.id === vehicleId);
      if (target) {
        setReserveModalVehicle(target);
        return;
      }
    }

    setLoadingId(vehicleId);
    const updatedBy = user?.displayName || "Showroom Staff";
    const nextImportStage =
      newStatus === "available"
        ? "ready"
        : newStatus === "incoming"
        ? "shipped"
        : undefined;

    const res = await updateVehicleStatusAction(
      vehicleId,
      newStatus,
      nextImportStage,
      updatedBy
    );
    setLoadingId(null);
    if (res.success) {
      if (newStatus === "sold" && viewTab === "active") {
        setStatusMessage("Vehicle marked as Sold and moved to the 'Sold Units' section.");
        setTimeout(() => setStatusMessage(null), 6000);
      } else if (newStatus !== "sold" && viewTab === "sold") {
        setStatusMessage("Vehicle status updated and returned to Active Showroom Fleet.");
        setTimeout(() => setStatusMessage(null), 6000);
      } else if (newStatus === "incoming") {
        setStatusMessage("Vehicle marked as Incoming (In-Transit) and added to Shipments under '2. Shipped'.");
        setTimeout(() => setStatusMessage(null), 6000);
      }
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                status: newStatus,
                importStage: nextImportStage !== undefined ? nextImportStage : v.importStage,
                reservation: newStatus !== "reserved" ? null : v.reservation,
                updatedAt: new Date().toISOString(),
                updatedBy,
              }
            : v
        )
      );
    }
  }

  async function handleReleaseHold(vehicleId: string) {
    setLoadingId(vehicleId);
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await releaseVehicleReservationAction(vehicleId, "Staff released hold", updatedBy);
    setLoadingId(null);
    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                status: "available",
                reservation: null,
                updatedAt: new Date().toISOString(),
                updatedBy,
              }
            : v
        )
      );
      setReleaseConfirmId(null);
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

      {/* Active Hold Expiry Alerts Banner */}
      {(expiredHolds.length > 0 || expiringSoonHolds.length > 0) && (
        <div className="p-4 badge-status-warning rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-0.5">
              <p className="font-serif text-base text-[var(--text-primary)] font-medium">
                {expiredHolds.length > 0
                  ? `${expiredHolds.length} Vehicle Reservation Hold${expiredHolds.length === 1 ? "" : "s"} Expired`
                  : `${expiringSoonHolds.length} Vehicle Reservation Hold${expiringSoonHolds.length === 1 ? "" : "s"} Expiring Soon`}
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-light">
                {expiredHolds.length > 0
                  ? "Deposit hold duration has elapsed. Contact buyer for payment settlement or release hold back to showroom stock."
                  : "Customer deposit hold expires within 24 hours. Contact customer for final registration balance."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewTab("active");
              setStatusFilter("reserved");
            }}
            className="min-h-[40px] px-4 text-xs font-sans uppercase font-medium tracking-wider badge-status-warning hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
          >
            Filter Reserved Units ({reservedWithHolds.length})
          </button>
        </div>
      )}

      {/* Tabs: Active Fleet vs Sold vs Archived */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-[var(--border-hairline)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => switchTab("active")}
          className={`min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider transition-colors border-b-2 cursor-pointer shrink-0 ${
            viewTab === "active"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Active Showroom Fleet ({activeVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => switchTab("sold")}
          className={`min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider transition-colors border-b-2 cursor-pointer shrink-0 ${
            viewTab === "sold"
              ? "border-red-500 text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Sold Units ({soldVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => switchTab("archived")}
          className={`min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider transition-colors border-b-2 cursor-pointer shrink-0 ${
            viewTab === "archived"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Archived Fleet ({archivedVehicles.length})
        </button>
      </div>

      {/* Real-time Status Movement Toast */}
      {statusMessage && (
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2px] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>{statusMessage}</span>
          </div>
          {viewTab === "active" && (
            <button
              type="button"
              onClick={() => switchTab("sold")}
              className="text-[var(--accent)] hover:underline uppercase font-medium tracking-wider text-[11px] cursor-pointer"
            >
              View in Sold Units &rarr;
            </button>
          )}
          {viewTab === "sold" && (
            <button
              type="button"
              onClick={() => switchTab("active")}
              className="text-[var(--accent)] hover:underline uppercase font-medium tracking-wider text-[11px] cursor-pointer"
            >
              Back to Active Fleet &rarr;
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className={viewTab === "active" ? "sm:col-span-4" : "sm:col-span-6"}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by make, model, VIN / chassis, color..."
            className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setBodyFilter(e.target.value);
              setCurrentPage(1);
            }}
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

        {viewTab === "active" && (
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Active Statuses ({activeVehicles.length})</option>
              <option value="available">
                Available ({activeVehicles.filter((v) => v.status === "available").length})
              </option>
              <option value="incoming">
                Incoming ({activeVehicles.filter((v) => v.status === "incoming").length})
              </option>
              <option value="reserved">
                Reserved ({activeVehicles.filter((v) => v.status === "reserved").length})
              </option>
            </select>
          </div>
        )}
      </div>

      {/* Vehicles Inventory List */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <p className="font-serif text-xl text-[var(--text-primary)]">
            No {viewTab === "active" ? "active" : viewTab === "sold" ? "sold" : "archived"} vehicles match your search
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            Try adjusting your keyword filter or adding a new vehicle to the showroom fleet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {paginatedVehicles.map((vehicle) => {
            const isUpdating = loadingId === vehicle.id;
            const formattedPrice = vehicle.price
              ? `LKR ${vehicle.price.toLocaleString("en-US")}`
              : "Price on Call";

            return (
              <div
                key={vehicle.id}
                className={`p-5 sm:p-6 space-y-4 transition-opacity ${
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Vehicle Thumbnail + Info */}
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="w-28 sm:w-36 md:w-44 shrink-0 overflow-hidden rounded-[2px] border border-[var(--border-hairline)] bg-[var(--bg-base)] relative">
                    <VehicleImage
                      src={vehicle.images[0] || "/images/vehicles/placeholder-coming-soon.webp"}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      aspectRatio="16/10"
                    />
                    {vehicle.status === "sold" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 border border-red-500/70 bg-black/85 px-2 py-0.5 rounded-[1px]">
                          Sold
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-medium leading-snug">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      {vehicle.grade && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                          {vehicle.grade}
                        </span>
                      )}
                      {vehicle.chassisNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 uppercase rounded-[2px] bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-medium" title="Chassis / VIN (Admin Only)">
                          VIN: {vehicle.chassisNumber}
                        </span>
                      )}
                      {vehicle.archived ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 uppercase rounded-[2px] badge-status-danger font-semibold">
                          Archived
                        </span>
                      ) : (
                        <>
                          {vehicle.status === "sold" && (
                            <span className="text-[9px] font-mono px-2 py-0.5 uppercase rounded-[2px] bg-red-950/60 text-red-300 border border-red-800 font-bold">
                              Sold
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 uppercase rounded-[2px] font-semibold ${
                              vehicle.published
                                ? "badge-status-success"
                                : "badge-status-warning"
                            }`}
                          >
                            {vehicle.published ? "Live on Site" : "Hidden Draft"}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--accent)] font-medium">
                        {formatBranch(vehicle.branch)}
                      </span>
                      <span>•</span>
                      <span>{formatBodyType(vehicle.bodyType)}</span>
                      <span>•</span>
                      <span>{vehicle.driveType}</span>
                      <span>•</span>
                      <span>{vehicle.seats} Seats</span>
                      <span>•</span>
                      <span className={vehicle.registrationStatus === "unregistered" ? "text-status-success font-medium" : ""}>
                        {vehicle.registrationStatus === "unregistered" ? "Unregistered" : `Registered (${vehicle.owners} Owner)`}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[var(--text-primary)]">
                        Grade {vehicle.auctionGrade} ({vehicle.auctionScore})
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] font-light">
                      {vehicle.mileage.toLocaleString("en-US")} KM • {vehicle.fuel} •{" "}
                      {vehicle.transmission} • {vehicle.color}
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

                    {/* Showroom Deposit Note & Hold Alert Card for Reserved Units */}
                    {vehicle.status === "reserved" && (
                      <div className="mt-3 p-3.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-2">
                        {(() => {
                          const holdStatus = getHoldExpiryStatus(vehicle.reservation?.holdExpiryDate);
                          return (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold rounded-[1px]">
                                    Deposit Recorded
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                                    {vehicle.reservation?.depositAmount
                                      ? `LKR ${vehicle.reservation.depositAmount.toLocaleString("en-US")}`
                                      : "Deposit Pending"}
                                  </span>
                                  {vehicle.reservation?.depositDate && (
                                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                                      • Paid {vehicle.reservation.depositDate}
                                    </span>
                                  )}
                                </div>

                                {holdStatus && (
                                  <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded-[1px] ${holdStatus.badgeClass}`}>
                                    {holdStatus.label}
                                  </span>
                                )}
                              </div>

                              {(vehicle.reservation?.customerName || vehicle.reservation?.customerPhone) && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Reserved by: <strong className="text-[var(--text-primary)] font-medium">{vehicle.reservation.customerName || "Customer"}</strong>
                                  {vehicle.reservation.customerPhone && (
                                    <span className="font-mono ml-1.5 text-[var(--text-secondary)]">
                                      ({formatPhoneDisplay(vehicle.reservation.customerPhone)})
                                    </span>
                                  )}
                                </p>
                              )}

                              {vehicle.reservation?.notes && (
                                <p className="text-xs text-[var(--text-secondary)] italic font-light bg-[var(--bg-surface)] p-2 rounded-[2px] border border-[var(--border-hairline)]">
                                  &ldquo;{vehicle.reservation.notes}&rdquo;
                                </p>
                              )}

                              <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-secondary)] font-mono border-t border-[var(--border-hairline)]">
                                <span>
                                  Hold Expiry:{" "}
                                  {vehicle.reservation?.holdExpiryDate
                                    ? new Date(vehicle.reservation.holdExpiryDate).toLocaleString("en-LK", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Not configured"}
                                </span>
                                <span>Recorded by: {vehicle.reservation?.reservedBy || "Staff"}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dedicated Action Toolbar */}
                <div className="pt-3.5 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
                  {!vehicle.archived ? (
                    <>
                      {/* Left Operational Actions */}
                      <div className="flex flex-wrap items-center gap-2.5">
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
                            className="h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
                          className={`min-h-[40px] px-3.5 text-xs font-sans uppercase font-medium tracking-wider border rounded-[2px] transition-colors cursor-pointer ${
                            vehicle.published
                              ? "border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-amber-700 hover:text-amber-500"
                              : "badge-status-success hover:opacity-90"
                          }`}
                        >
                          {vehicle.published ? "Hide from Site" : "Show on Website"}
                        </button>

                        {/* "Reserve this vehicle" or Reservation Hold Management Controls */}
                        {vehicle.status === "reserved" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReserveModalVehicle(vehicle)}
                              className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
                              title="Edit deposit note or extend hold expiry"
                            >
                              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit Hold</span>
                            </button>

                            {releaseConfirmId === vehicle.id ? (
                              <div className="flex items-center gap-1.5 p-1 badge-status-danger rounded-[2px]">
                                <span className="text-[10px] text-status-danger font-sans px-1 font-semibold">
                                  Release hold?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleReleaseHold(vehicle.id)}
                                  className="min-h-[34px] px-2.5 bg-red-800 text-white text-[10px] font-sans uppercase tracking-wider hover:bg-red-700 rounded-[2px] cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReleaseConfirmId(null)}
                                  className="min-h-[34px] px-2 text-[10px] uppercase text-[var(--text-secondary)] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReleaseConfirmId(vehicle.id)}
                                className="min-h-[40px] px-3 inline-flex items-center gap-1 text-xs font-sans uppercase font-medium tracking-wider text-status-danger hover:opacity-80 transition-colors cursor-pointer"
                                title="Release deposit hold and return vehicle to Available showroom stock"
                              >
                                <span>Release Hold</span>
                              </button>
                            )}
                          </div>
                        ) : vehicle.status === "sold" ? (
                          <div className="flex items-center gap-2">
                            <span className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-800/50 rounded-[2px] font-semibold select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span>Sold / Delivered</span>
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReserveModalVehicle(vehicle)}
                            className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm cursor-pointer"
                            title="Reserve vehicle with customer deposit note & hold expiry"
                          >
                            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <span>Reserve this vehicle</span>
                          </button>
                        )}
                      </div>

                      {/* Right Quick Actions */}
                      <div className="flex items-center gap-2">
                        {/* Edit Details */}
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="min-h-[40px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                        >
                          Edit
                        </Link>

                        {/* Social Poster Kit */}
                        <button
                          type="button"
                          onClick={() => setPosterModalVehicle(vehicle)}
                          className="min-h-[40px] px-3.5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-stone-900 transition-colors cursor-pointer"
                          title="Open Social Media Poster Studio & captions"
                        >
                          Poster
                        </button>

                        {/* Live Public View */}
                        <Link
                          href={`/vehicles/${vehicle.slug}`}
                          target="_blank"
                          className="min-h-[40px] px-3 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          title="View vehicle on public site"
                        >
                          Live &rarr;
                        </Link>

                        {/* Archive with confirmation */}
                        {archiveConfirmId === vehicle.id ? (
                          <div className="flex items-center gap-1.5 p-1 badge-status-warning rounded-[2px]">
                            <span className="text-[10px] text-status-warning font-sans px-1 font-semibold">
                              Archive vehicle?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleArchiveVehicle(vehicle.id)}
                              className="min-h-[34px] px-2.5 bg-amber-700 text-white text-[10px] font-sans uppercase tracking-wider hover:bg-amber-600 rounded-[2px]"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setArchiveConfirmId(null)}
                              className="min-h-[34px] px-2 text-[10px] uppercase text-[var(--text-secondary)]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setArchiveConfirmId(vehicle.id)}
                            className={`min-h-[40px] px-2.5 text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                              vehicle.status === "sold"
                                ? "text-amber-500 hover:text-amber-400 font-semibold"
                                : "text-[var(--text-secondary)] hover:text-status-warning"
                            }`}
                            title="Archive vehicle (unlists from website, preserves CRM records and profit analytics)"
                          >
                            {vehicle.status === "sold" ? "Archive Sold" : "Archive"}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Archived view actions */
                    <div className="flex items-center gap-3 w-full justify-between">
                      <span className="text-xs text-[var(--text-secondary)] italic">
                        Archived from public catalog
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRestoreVehicle(vehicle.id)}
                        className="min-h-[40px] px-4 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
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

      {/* Fleet Pagination Controls */}
      <AdminPagination
        currentPage={safePage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        itemName={
          viewTab === "active"
            ? "active showroom cars"
            : viewTab === "sold"
            ? "sold cars"
            : "archived cars"
        }
      />

      {/* Reserve Vehicle & Deposit Note Modal */}
      <ReserveVehicleModal
        vehicle={reserveModalVehicle}
        isOpen={Boolean(reserveModalVehicle)}
        onClose={() => setReserveModalVehicle(null)}
        onSuccess={(updatedVehicle) => {
          setVehicles((prev) =>
            prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
          );
        }}
      />

      {/* Social Poster Studio Modal */}
      {posterModalVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-5xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl rounded-[2px] overflow-hidden my-8">
            <SocialPosterGenerator
              vehicle={posterModalVehicle}
              onClose={() => setPosterModalVehicle(null)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
