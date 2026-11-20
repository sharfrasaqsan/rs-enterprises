"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { Lead } from "@/types/lead";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { updateVehicleCostAction } from "@/app/actions/admin";

interface AdminAnalyticsClientProps {
  initialVehicles: Vehicle[];
  initialLeads: Lead[];
}

export function AdminAnalyticsClient({
  initialVehicles,
  initialLeads,
}: AdminAnalyticsClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [leads] = useState<Lead[]>(initialLeads);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [branchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Graph View Controls: "financials" (Revenue & Profit) vs "volume" (Cars Sold & Stock Added)
  const [chartMetric, setChartMetric] = useState<"financials" | "volume">("financials");
  const [hoveredMonthKey, setHoveredMonthKey] = useState<string | null>(null);

  // Default Margin Assumption (used when a vehicle has no explicit landed cost entered)
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(12);

  // Cost edit modal state
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newCostInput, setNewCostInput] = useState<string>("");
  const [isUpdatingCost, setIsUpdatingCost] = useState(false);
  const [costUpdateMsg, setCostUpdateMsg] = useState<string | null>(null);

  // Table sorting
  const [sortField, setSortField] = useState<"date" | "price" | "cost" | "profit" | "margin">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dynamic Month Computations
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const lastYearMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Compute available months from all vehicle and lead records
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { label: string; count: number }>();
    const allDates = [
      ...vehicles.map((v) => v.updatedAt || v.createdAt),
      ...leads.map((l) => l.createdAt),
    ];

    for (const iso of allDates) {
      if (!iso) continue;
      const d = new Date(iso);
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
  }, [vehicles, leads]);

  // Helper to calculate cost and profit for any vehicle
  const getVehicleFinancials = useCallback(
    (v: Vehicle) => {
      const retailPrice = v.price || 0;
      const hasKnownCost = v.costPrice !== undefined && v.costPrice !== null;
      const costPrice = hasKnownCost
        ? Number(v.costPrice)
        : Math.round(retailPrice * (1 - defaultMarginPercent / 100));
      const grossProfit = retailPrice > 0 ? retailPrice - costPrice : 0;
      const marginPercent = retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

      return {
        retailPrice,
        costPrice,
        grossProfit,
        marginPercent,
        hasKnownCost,
      };
    },
    [defaultMarginPercent]
  );

  // Filter vehicles according to active Period and Branch
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. Branch Filter
      if (branchFilter !== "all" && v.branch !== branchFilter) {
        return false;
      }

      // 2. Period Filter
      if (periodFilter !== "all") {
        const dateStr = v.status === "sold" ? (v.updatedAt || v.createdAt) : v.createdAt;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        if (periodFilter === "this_month") {
          if (ym !== currentYearMonth) return false;
        } else if (periodFilter === "last_month") {
          if (ym !== lastYearMonth) return false;
        } else if (periodFilter === "q4") {
          const monthNum = d.getMonth() + 1;
          if (d.getFullYear() !== 2026 || monthNum < 10 || monthNum > 12) return false;
        } else if (periodFilter === "ytd") {
          if (d.getFullYear() !== 2026) return false;
        } else {
          // Specific YYYY-MM
          if (ym !== periodFilter) return false;
        }
      }

      return true;
    });
  }, [vehicles, periodFilter, branchFilter, currentYearMonth, lastYearMonth]);

  // Filtered Leads according to active Period and Branch
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (branchFilter !== "all" && l.branch !== branchFilter) return false;

      if (periodFilter !== "all") {
        const d = new Date(l.createdAt);
        if (isNaN(d.getTime())) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        if (periodFilter === "this_month") {
          if (ym !== currentYearMonth) return false;
        } else if (periodFilter === "last_month") {
          if (ym !== lastYearMonth) return false;
        } else if (periodFilter === "q4") {
          const monthNum = d.getMonth() + 1;
          if (d.getFullYear() !== 2026 || monthNum < 10 || monthNum > 12) return false;
        } else if (periodFilter === "ytd") {
          if (d.getFullYear() !== 2026) return false;
        } else {
          if (ym !== periodFilter) return false;
        }
      }

      return true;
    });
  }, [leads, periodFilter, branchFilter, currentYearMonth, lastYearMonth]);

  // Aggregate Executive Financial Metrics
  const metrics = useMemo(() => {
    const soldVehicles = filteredVehicles.filter((v) => v.status === "sold");
    const availableVehicles = filteredVehicles.filter((v) => v.status === "available");
    const reservedVehicles = filteredVehicles.filter((v) => v.status === "reserved");
    const incomingVehicles = filteredVehicles.filter((v) => v.status === "incoming");

    // Realized Financials (from Sold units)
    let totalRevenue = 0;
    let totalLandedCost = 0;
    let totalGrossProfit = 0;

    soldVehicles.forEach((v) => {
      const f = getVehicleFinancials(v);
      totalRevenue += f.retailPrice;
      totalLandedCost += f.costPrice;
      totalGrossProfit += f.grossProfit;
    });

    const averageProfitPerUnit = soldVehicles.length > 0
      ? Math.round(totalGrossProfit / soldVehicles.length)
      : 0;

    const overallMargin = totalRevenue > 0
      ? Math.round((totalGrossProfit / totalRevenue) * 1000) / 10
      : defaultMarginPercent;

    // Working Capital in Active Stock (Available & Reserved)
    let availableStockValue = 0;
    let availableCostValue = 0;
    availableVehicles.forEach((v) => {
      const f = getVehicleFinancials(v);
      availableStockValue += f.retailPrice;
      availableCostValue += f.costPrice;
    });

    let reservedStockValue = 0;
    reservedVehicles.forEach((v) => {
      const f = getVehicleFinancials(v);
      reservedStockValue += f.retailPrice;
    });

    let incomingStockValue = 0;
    let incomingCostValue = 0;
    incomingVehicles.forEach((v) => {
      const f = getVehicleFinancials(v);
      incomingStockValue += f.retailPrice;
      incomingCostValue += f.costPrice;
    });

    // Pipeline economics
    const wonLeads = filteredLeads.filter((l) => l.stage === "won");
    const winRate = filteredLeads.length > 0
      ? Math.round((wonLeads.length / filteredLeads.length) * 100)
      : 0;

    return {
      soldCount: soldVehicles.length,
      availableCount: availableVehicles.length,
      reservedCount: reservedVehicles.length,
      incomingCount: incomingVehicles.length,
      totalRevenue,
      totalLandedCost,
      totalGrossProfit,
      averageProfitPerUnit,
      overallMargin,
      availableStockValue,
      availableCostValue,
      reservedStockValue,
      incomingStockValue,
      incomingCostValue,
      totalLeads: filteredLeads.length,
      wonLeadsCount: wonLeads.length,
      winRate,
    };
  }, [filteredVehicles, filteredLeads, defaultMarginPercent, getVehicleFinancials]);

  // Chronological Monthly Performance Data for the Executive Graph (Last 6 Months)
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const discoveredMonths = new Set<string>();

    vehicles.forEach((v) => {
      const dateStr = v.updatedAt || v.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          discoveredMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
      }
    });

    // Ensure the last 6 calendar months are represented
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      discoveredMonths.add(ym);
    }

    const sortedMonthKeys = Array.from(discoveredMonths).sort().slice(-6);

    return sortedMonthKeys.map((ym) => {
      const [year, month] = ym.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      const monthShort = d.toLocaleDateString("en-GB", { month: "short" });

      const soldThisMonth = vehicles.filter((v) => {
        if (v.status !== "sold") return false;
        if (branchFilter !== "all" && v.branch !== branchFilter) return false;
        const dateStr = v.updatedAt || v.createdAt;
        const vd = new Date(dateStr);
        if (!isNaN(vd.getTime())) {
          const vym = `${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, "0")}`;
          return vym === ym;
        }
        return false;
      });

      const addedThisMonth = vehicles.filter((v) => {
        if (branchFilter !== "all" && v.branch !== branchFilter) return false;
        const vd = new Date(v.createdAt);
        if (!isNaN(vd.getTime())) {
          const vym = `${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, "0")}`;
          return vym === ym;
        }
        return false;
      });

      let revenue = 0;
      let cost = 0;
      let profit = 0;

      soldThisMonth.forEach((v) => {
        const f = getVehicleFinancials(v);
        revenue += f.retailPrice;
        cost += f.costPrice;
        profit += f.grossProfit;
      });

      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        key: ym,
        label,
        monthShort,
        year,
        revenue,
        cost,
        profit,
        margin,
        soldCount: soldThisMonth.length,
        addedCount: addedThisMonth.length,
      };
    });
  }, [vehicles, branchFilter, getVehicleFinancials]);

  // Peak Revenue Month
  const peakMonth = useMemo(() => {
    if (monthlyChartData.length === 0) return null;
    return [...monthlyChartData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [monthlyChartData]);

  // Active or Hovered Month for Focus Banner
  const activeHoveredMonth = useMemo(() => {
    if (hoveredMonthKey) {
      const found = monthlyChartData.find((m) => m.key === hoveredMonthKey);
      if (found) return found;
    }
    return peakMonth && peakMonth.revenue > 0
      ? peakMonth
      : monthlyChartData[monthlyChartData.length - 1];
  }, [hoveredMonthKey, monthlyChartData, peakMonth]);

  // Detailed Ledger List for the Data Table
  const tableLedger = useMemo(() => {
    let list = filteredVehicles;

    if (statusFilter !== "all") {
      list = list.filter((v) => v.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.year.toString().includes(q) ||
          (v.chassisNumber && v.chassisNumber.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      const fa = getVehicleFinancials(a);
      const fb = getVehicleFinancials(b);
      let comp = 0;

      if (sortField === "profit") {
        comp = fa.grossProfit - fb.grossProfit;
      } else if (sortField === "margin") {
        comp = fa.marginPercent - fb.marginPercent;
      } else if (sortField === "price") {
        comp = fa.retailPrice - fb.retailPrice;
      } else if (sortField === "cost") {
        comp = fa.costPrice - fb.costPrice;
      } else if (sortField === "date") {
        comp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return sortOrder === "asc" ? comp : -comp;
    });
  }, [filteredVehicles, statusFilter, searchQuery, sortField, sortOrder, getVehicleFinancials]);

  // Handle Cost Update
  async function handleSaveCost() {
    if (!editingVehicle) return;
    setIsUpdatingCost(true);
    setCostUpdateMsg(null);

    const costNum = newCostInput.trim() ? Number(newCostInput) : null;
    const res = await updateVehicleCostAction(editingVehicle.id, costNum);
    setIsUpdatingCost(false);

    if (res.success) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === editingVehicle.id ? { ...v, costPrice: costNum } : v))
      );
      setCostUpdateMsg("Landed cost updated successfully.");
      setTimeout(() => {
        setEditingVehicle(null);
        setCostUpdateMsg(null);
      }, 1000);
    } else {
      setCostUpdateMsg(res.error || "Failed to update cost.");
    }
  }

  // Currency Formatter
  function formatLKR(amount: number) {
    if (amount >= 1000000) {
      const inMillions = amount / 1000000;
      return `LKR ${inMillions.toFixed(2)}M`;
    }
    return `LKR ${amount.toLocaleString()}`;
  }

  function formatFullLKR(amount: number) {
    return `LKR ${amount.toLocaleString()}`;
  }

  // Get active period title label
  const periodTitle = useMemo(() => {
    if (periodFilter === "all") return "All Time Performance";
    if (periodFilter === "this_month") return "This Month (November 2026)";
    if (periodFilter === "last_month") return "Last Month (October 2026)";
    if (periodFilter === "q4") return "Fourth Quarter 2026 (Q4)";
    if (periodFilter === "ytd") return "Year-To-Date (2026)";
    if (/^\d{4}-\d{2}$/.test(periodFilter)) {
      const [y, m] = periodFilter.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      }
    }
    const found = availableMonths.find((m) => m.key === periodFilter);
    return found ? found.label : periodFilter;
  }, [periodFilter, availableMonths]);

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================= */}
      {/* 1. EDITORIAL HEADER & QUICK ACTIONS                       */}
      {/* ========================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS                            */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Showroom Financials</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Sales &amp; Profit
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Kaduruwela Showroom &bull; Simple tracking of showroom stock, vehicles sold, and net profit earned
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-4 inline-flex items-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px] cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Report</span>
          </button>

          <Link
            href="/admin/vehicles/new"
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] shadow-sm"
          >
            + Add Car
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FILTER & TIME HORIZON BAR                             */}
      {/* ========================================================= */}
      <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Period Segment */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mr-1">
              Period:
            </span>
            <div className="inline-flex p-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
              {[
                { key: "all", label: "All Time" },
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
                { key: "q4", label: "Q4 2026" },
                { key: "ytd", label: "Full Year 2026" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodFilter(p.key)}
                  className={`h-7 px-3 text-[10px] font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                    periodFilter === p.key
                      ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar Month Picker */}
            <div className="relative flex items-center">
              <input
                type="month"
                value={/^\d{4}-\d{2}$/.test(periodFilter) ? periodFilter : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setPeriodFilter(val || "all");
                }}
                onClick={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                  } catch {
                    // Fallback
                  }
                }}
                className="h-8 pl-7 pr-7 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[10px] font-mono text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                title="Click to open calendar and select any month"
                aria-label="Select custom month calendar"
              />
              <div className="absolute left-2 pointer-events-none text-[var(--accent)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              {/^\d{4}-\d{2}$/.test(periodFilter) && (
                <button
                  type="button"
                  onClick={() => setPeriodFilter("all")}
                  className="absolute right-1.5 h-5 w-5 flex items-center justify-center text-[10px] text-[var(--text-secondary)] hover:text-red-400 rounded-[1px] cursor-pointer"
                  title="Clear custom month (Show All Time)"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Showroom Branch Tag */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Showroom:
            </span>
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              📍 Kaduruwela Main Showroom
            </span>
          </div>
        </div>

        {/* Profit Assumption / Landed Cost Controller */}
        <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>
              Active Filter: <strong className="text-[var(--text-primary)] font-medium">{periodTitle}</strong> &bull; Kaduruwela Main Showroom
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Dealer Margin on Unspecified Costs:</span>
            <div className="inline-flex items-center gap-1 bg-[var(--bg-base)] px-2 py-0.5 border border-[var(--border-hairline)] rounded-[2px]">
              {[10, 12, 15, 18].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDefaultMarginPercent(pct)}
                  className={`px-1.5 py-0.5 rounded-[1px] text-[10px] cursor-pointer ${
                    defaultMarginPercent === pct
                      ? "bg-[var(--accent)] text-white font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SHOWROOM EXECUTIVE FINANCIAL SUMMARY (4 TILES)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Profit Earned */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-success font-semibold block">
            Total Profit Earned
          </span>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--text-primary)]">
            {formatLKR(metrics.totalGrossProfit)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 badge-status-success rounded-[1px] font-semibold">
              {metrics.overallMargin}% Margin
            </span>
            <span className="text-[var(--text-secondary)]">from {metrics.soldCount} cars sold</span>
          </div>
        </div>

        {/* Vehicles Sold */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)] font-semibold block">
            Vehicles Sold
          </span>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--text-primary)]">
            {metrics.soldCount} <span className="text-lg font-sans font-normal text-[var(--text-secondary)]">Delivered</span>
          </div>
          <div className="mt-2 text-xs font-mono text-[var(--text-secondary)]">
            Gross Sales: <span className="font-semibold text-[var(--text-primary)]">{formatLKR(metrics.totalRevenue)}</span>
          </div>
        </div>

        {/* Showroom Stock Value */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-info font-semibold block">
            Showroom Stock Value
          </span>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--text-primary)]">
            {formatLKR(metrics.availableStockValue)}
          </div>
          <div className="mt-2 text-xs font-mono text-[var(--text-secondary)]">
            {metrics.availableCount} available cars in showroom
          </div>
        </div>

        {/* Incoming Fleet */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-warning font-semibold block">
            Incoming Shipments
          </span>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--text-primary)]">
            {metrics.incomingCount} <span className="text-lg font-sans font-normal text-[var(--text-secondary)]">Units</span>
          </div>
          <div className="mt-2 text-xs font-mono text-[var(--text-secondary)]">
            Est. Value: <span className="font-semibold text-[var(--text-primary)]">{formatLKR(metrics.incomingStockValue)}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SHOWROOM MONTHLY REVENUE & PROFIT GRAPH               */}
      {/* ========================================================= */}
      <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-5 shadow-sm">
        {/* Graph Header: Title, Legend & Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <Eyebrow>Performance Trends</Eyebrow>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] mt-1 font-medium">
              {chartMetric === "financials" ? "Revenue vs Net Profit Progression" : "Sales Volume & Showroom Inventory Growth"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
              Kaduruwela Showroom &bull; 6-month historical progression with interactive month inspection
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legend Pills */}
            <div className="flex items-center gap-3 text-xs font-mono">
              {chartMetric === "financials" ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[2px] bg-gradient-to-t from-[#A88438] to-[#E8C55C]" />
                    <span className="text-[var(--text-secondary)]">Gross Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[2px] bg-gradient-to-t from-[#059669] to-[#34D399]" />
                    <span className="text-[var(--text-secondary)]">Net Profit</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[2px] bg-gradient-to-t from-[#A88438] to-[#E8C55C]" />
                    <span className="text-[var(--text-secondary)]">Delivered (Sold)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[2px] bg-gradient-to-t from-[#0284C7] to-[#38BDF8]" />
                    <span className="text-[var(--text-secondary)]">Stock Added</span>
                  </div>
                </>
              )}
            </div>

            {/* Metric Mode Switcher */}
            <div className="inline-flex p-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
              <button
                type="button"
                onClick={() => setChartMetric("financials")}
                className={`h-7 px-3 text-[10px] font-sans uppercase font-medium tracking-wider rounded-[1px] transition-colors cursor-pointer ${
                  chartMetric === "financials"
                    ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Revenue &amp; Profit (LKR)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("volume")}
                className={`h-7 px-3 text-[10px] font-sans uppercase font-medium tracking-wider rounded-[1px] transition-colors cursor-pointer ${
                  chartMetric === "volume"
                    ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Volume (Cars)
              </button>
            </div>
          </div>
        </div>

        {/* Live Month Focus Banner */}
        <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
            <span className="font-sans font-medium text-[var(--text-primary)]">
              {activeHoveredMonth?.label || "October 2026"}:
            </span>
            {chartMetric === "financials" ? (
              <>
                <span className="font-mono text-status-success font-semibold">
                  {formatLKR(activeHoveredMonth?.profit || 0)} Net Profit
                </span>
                {activeHoveredMonth?.margin ? (
                  <span className="px-1.5 py-0.2 badge-status-success text-[10px] font-mono rounded-[1px]">
                    {activeHoveredMonth.margin}% Margin
                  </span>
                ) : null}
              </>
            ) : (
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                {activeHoveredMonth?.soldCount || 0} Delivered &bull; {activeHoveredMonth?.addedCount || 0} Added to Showroom
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-secondary)]">
            <span>
              Gross Sales: <strong className="text-[var(--text-primary)]">{formatLKR(activeHoveredMonth?.revenue || 0)}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Delivered: <strong className="text-[var(--accent)]">{activeHoveredMonth?.soldCount || 0} cars</strong>
            </span>
            {periodFilter === activeHoveredMonth?.key ? (
              <button
                type="button"
                onClick={() => setPeriodFilter("all")}
                className="px-2 py-0.5 text-[9px] uppercase font-sans font-medium bg-[var(--accent)] text-white rounded-[1px] cursor-pointer"
              >
                Clear Month Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPeriodFilter(activeHoveredMonth?.key || "all")}
                className="px-2 py-0.5 text-[9px] uppercase font-sans font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] rounded-[1px] cursor-pointer"
              >
                Filter Ledger &rarr;
              </button>
            )}
          </div>
        </div>

        {/* SVG Responsive Chart */}
        <div className="w-full overflow-x-auto pb-2">
          {(() => {
            const width = 800;
            const height = 240;
            const padLeft = 75;
            const padRight = 25;
            const padTop = 25;
            const padBottom = 35;
            const chartW = width - padLeft - padRight;
            const chartH = height - padTop - padBottom;

            // Calculations based on active metric
            const maxFinancial = Math.max(...monthlyChartData.map((m) => m.revenue), 10_000_000);
            const ceilingFinancial = Math.max(10_000_000, Math.ceil(maxFinancial / 10_000_000) * 10_000_000);

            const maxUnits = Math.max(...monthlyChartData.map((m) => Math.max(m.soldCount, m.addedCount)), 4);
            const ceilingVolume = Math.max(4, Math.ceil(maxUnits / 2) * 2);

            const ceiling = chartMetric === "financials" ? ceilingFinancial : ceilingVolume;

            const gridLevels = [1, 0.75, 0.5, 0.25, 0];
            const slotW = chartW / monthlyChartData.length;
            const barW = 24;
            const gap = 5;

            return (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto min-w-[620px] select-none"
                style={{ maxHeight: "280px" }}
              >
                <defs>
                  {/* Champagne Gold Gradient for Gross Sales / Delivered */}
                  <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8C55C" />
                    <stop offset="100%" stopColor="#A88438" />
                  </linearGradient>

                  {/* Emerald Gradient for Net Profit */}
                  <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>

                  {/* Sky Blue Gradient for Stock Added */}
                  <linearGradient id="skyBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {gridLevels.map((lvl) => {
                  const y = padTop + chartH * (1 - lvl);
                  const labelValue = ceiling * lvl;
                  const labelText =
                    chartMetric === "financials"
                      ? lvl === 0
                        ? "LKR 0"
                        : formatLKR(labelValue)
                      : `${Math.round(labelValue)} cars`;

                  return (
                    <g key={lvl}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={padLeft + chartW}
                        y2={y}
                        stroke="currentColor"
                        className="text-[var(--border-hairline)]"
                        strokeDasharray={lvl === 0 ? "none" : "3 3"}
                        strokeWidth={lvl === 0 ? "1.5" : "1"}
                      />
                      <text
                        x={padLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-[var(--text-secondary)] font-medium"
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Monthly Bars & Hit Areas */}
                {monthlyChartData.map((m, idx) => {
                  const slotCenterX = padLeft + (idx + 0.5) * slotW;
                  const isHovered = hoveredMonthKey === m.key;
                  const isSelected = periodFilter === m.key;

                  // Values
                  const val1 = chartMetric === "financials" ? m.revenue : m.soldCount;
                  const val2 = chartMetric === "financials" ? m.profit : m.addedCount;

                  const bar1H = ceiling > 0 && val1 > 0 ? (val1 / ceiling) * chartH : 0;
                  const bar2H = ceiling > 0 && val2 > 0 ? (val2 / ceiling) * chartH : 0;

                  const bar1X = slotCenterX - barW - gap / 2;
                  const bar1Y = padTop + chartH - bar1H;

                  const bar2X = slotCenterX + gap / 2;
                  const bar2Y = padTop + chartH - bar2H;

                  return (
                    <g key={m.key} className="transition-all duration-200">
                      {/* Active / Hover Background Column Highlight */}
                      <rect
                        x={padLeft + idx * slotW + 4}
                        y={padTop}
                        width={slotW - 8}
                        height={chartH + 30}
                        fill="currentColor"
                        className={`transition-opacity cursor-pointer ${
                          isSelected
                            ? "text-[var(--accent)] opacity-10"
                            : isHovered
                            ? "text-[var(--text-primary)] opacity-5"
                            : "opacity-0"
                        }`}
                        rx="2"
                        onMouseEnter={() => setHoveredMonthKey(m.key)}
                        onClick={() => setPeriodFilter(periodFilter === m.key ? "all" : m.key)}
                      />

                      {/* Bar 1 (Gross Sales or Delivered) */}
                      {bar1H > 0 ? (
                        <g>
                          <rect
                            x={bar1X}
                            y={bar1Y}
                            width={barW}
                            height={bar1H}
                            fill="url(#goldBarGrad)"
                            rx="2"
                            ry="2"
                            className="transition-all duration-200 cursor-pointer hover:brightness-110"
                            onMouseEnter={() => setHoveredMonthKey(m.key)}
                            onClick={() => setPeriodFilter(periodFilter === m.key ? "all" : m.key)}
                          />
                          {/* Value callout above Bar 1 */}
                          <text
                            x={bar1X + barW / 2}
                            y={bar1Y - 5}
                            textAnchor="middle"
                            className="text-[9px] font-mono fill-[var(--text-primary)] font-semibold"
                          >
                            {chartMetric === "financials"
                              ? `${(m.revenue / 1000000).toFixed(1)}M`
                              : m.soldCount}
                          </text>
                        </g>
                      ) : (
                        <circle
                          cx={bar1X + barW / 2}
                          cy={padTop + chartH - 2}
                          r="1.5"
                          className="fill-[var(--text-secondary)] opacity-30"
                        />
                      )}

                      {/* Bar 2 (Net Profit or Stock Added) */}
                      {bar2H > 0 ? (
                        <g>
                          <rect
                            x={bar2X}
                            y={bar2Y}
                            width={barW}
                            height={bar2H}
                            fill={chartMetric === "financials" ? "url(#emeraldBarGrad)" : "url(#skyBarGrad)"}
                            rx="2"
                            ry="2"
                            className="transition-all duration-200 cursor-pointer hover:brightness-110"
                            onMouseEnter={() => setHoveredMonthKey(m.key)}
                            onClick={() => setPeriodFilter(periodFilter === m.key ? "all" : m.key)}
                          />
                          {/* Value callout above Bar 2 */}
                          <text
                            x={bar2X + barW / 2}
                            y={bar2Y - 5}
                            textAnchor="middle"
                            className={`text-[9px] font-mono font-semibold ${
                              chartMetric === "financials" ? "fill-emerald-500" : "fill-sky-400"
                            }`}
                          >
                            {chartMetric === "financials"
                              ? `${(m.profit / 1000000).toFixed(1)}M`
                              : m.addedCount}
                          </text>
                        </g>
                      ) : (
                        <circle
                          cx={bar2X + barW / 2}
                          cy={padTop + chartH - 2}
                          r="1.5"
                          className="fill-[var(--text-secondary)] opacity-30"
                        />
                      )}

                      {/* X-Axis Month Label */}
                      <text
                        x={slotCenterX}
                        y={padTop + chartH + 20}
                        textAnchor="middle"
                        className={`text-[11px] font-sans transition-colors cursor-pointer ${
                          isSelected
                            ? "fill-[var(--accent)] font-bold"
                            : isHovered
                            ? "fill-[var(--text-primary)] font-semibold"
                            : "fill-[var(--text-secondary)] font-medium"
                        }`}
                        onMouseEnter={() => setHoveredMonthKey(m.key)}
                        onClick={() => setPeriodFilter(periodFilter === m.key ? "all" : m.key)}
                      >
                        {m.monthShort}
                      </text>
                      <text
                        x={slotCenterX}
                        y={padTop + chartH + 31}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-[var(--text-secondary)] opacity-60 cursor-pointer"
                        onMouseEnter={() => setHoveredMonthKey(m.key)}
                        onClick={() => setPeriodFilter(periodFilter === m.key ? "all" : m.key)}
                      >
                        {m.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>

        {/* 6-Month Quick Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 border-t border-[var(--border-hairline)]">
          {monthlyChartData.map((m) => {
            const isSelected = periodFilter === m.key;
            const hasSales = m.soldCount > 0;

            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setPeriodFilter(isSelected ? "all" : m.key)}
                onMouseEnter={() => setHoveredMonthKey(m.key)}
                className={`p-2.5 text-left rounded-[2px] transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                    : "bg-[var(--bg-base)] border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${isSelected ? "text-white" : "text-[var(--text-primary)]"}`}>
                    {m.monthShort} {m.year}
                  </span>
                  {hasSales && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className={`text-xs font-mono font-medium ${isSelected ? "text-white" : hasSales ? "text-status-success font-semibold" : "text-[var(--text-secondary)]"}`}>
                    {hasSales ? formatLKR(m.profit) : "0 Profit"}
                  </span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-white/80" : "text-[var(--text-secondary)]"}`}>
                  {m.soldCount} sold &bull; {m.addedCount} in
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. VEHICLE SALES & PROFIT LEDGER                          */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Eyebrow>Showroom Profit Ledger</Eyebrow>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] mt-0.5">
              Sold Cars &amp; Stock Profit Ledger
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
              Selling price, purchase cost, and net profit earned per vehicle
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Filter Pills */}
            <div className="inline-flex p-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`h-8 px-3 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                All ({filteredVehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("sold")}
                className={`h-8 px-3 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  statusFilter === "sold"
                    ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sold Cars ({metrics.soldCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("available")}
                className={`h-8 px-3 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  statusFilter === "available"
                    ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Available ({metrics.availableCount})
              </button>
            </div>

            {/* Keyword Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search make, model, VIN..."
              className="h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-base)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-3 px-4">Vehicle Description</th>
                  <th className="py-3 px-4">Status &amp; Branch</th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "price") setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                        else {
                          setSortField("price");
                          setSortOrder("desc");
                        }
                      }}
                      className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <span>Retail Price</span>
                      {sortField === "price" && (
                        <span className="text-[var(--accent)]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "cost") setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                        else {
                          setSortField("cost");
                          setSortOrder("desc");
                        }
                      }}
                      className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <span>Landed Cost</span>
                      {sortField === "cost" && (
                        <span className="text-[var(--accent)]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "profit") setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                        else {
                          setSortField("profit");
                          setSortOrder("desc");
                        }
                      }}
                      className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <span>Gross Profit</span>
                      {sortField === "profit" && (
                        <span className="text-[var(--accent)]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "margin") setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                        else {
                          setSortField("margin");
                          setSortOrder("desc");
                        }
                      }}
                      className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <span>Margin %</span>
                      {sortField === "margin" && (
                        <span className="text-[var(--accent)]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {tableLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)] italic">
                      No vehicles found matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  tableLedger.map((v) => {
                    const f = getVehicleFinancials(v);
                    const isSold = v.status === "sold";

                    return (
                      <tr key={v.id} className="hover:bg-[var(--bg-base)]/80 transition-colors">
                        {/* Vehicle Title & Chassis */}
                        <td className="py-3.5 px-4">
                          <div className="font-serif text-sm font-medium text-[var(--text-primary)]">
                            {v.year} {v.make} {v.model}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[var(--text-secondary)]">
                            {v.chassisNumber && <span>VIN: {v.chassisNumber}</span>}
                            <span>&bull;</span>
                            <span>{v.engineCC} CC</span>
                            <span>&bull;</span>
                            <span>{v.mileage.toLocaleString()} KM</span>
                          </div>
                        </td>

                        {/* Status & Branch */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 text-[9px] uppercase rounded-[1px] font-semibold ${
                                v.status === "sold"
                                  ? "badge-status-success"
                                  : v.status === "available"
                                  ? "badge-status-info"
                                  : v.status === "reserved"
                                  ? "badge-status-warning"
                                  : "badge-status-purple"
                              }`}
                            >
                              {v.status === "sold"
                                ? "Sold"
                                : v.status === "available"
                                ? "Available"
                                : v.status === "reserved"
                                ? "Reserved"
                                : "Incoming"}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] uppercase bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)] rounded-[1px]">
                              {v.branch === "polonnaruwa" ? "Kaduruwela" : "Trinco"}
                            </span>
                          </div>
                        </td>

                        {/* Retail Price */}
                        <td className="py-3.5 px-4 text-right font-mono text-[var(--text-primary)] font-medium">
                          {v.price ? formatFullLKR(v.price) : "Call for Price"}
                        </td>

                        {/* Landed Cost */}
                        <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                          <div>{formatFullLKR(f.costPrice)}</div>
                          <span className="text-[9px] text-[var(--text-muted)] block">
                            {f.hasKnownCost ? "Actual recorded cost" : `Est. (${100 - defaultMarginPercent}%)`}
                          </span>
                        </td>

                        {/* Gross Profit */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">
                          <span className={isSold ? "text-status-success" : "text-[var(--text-primary)]"}>
                            {formatFullLKR(f.grossProfit)}
                          </span>
                          <span className="text-[9px] text-[var(--text-secondary)] block font-normal">
                            {isSold ? "Realized" : "Potential"}
                          </span>
                        </td>

                        {/* Margin % */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-[1px] font-semibold ${
                              f.marginPercent >= 15
                                ? "badge-status-success"
                                : f.marginPercent >= 10
                                ? "badge-status-warning"
                                : "badge-status-neutral"
                            }`}
                          >
                            {f.marginPercent.toFixed(1)}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVehicle(v);
                                setNewCostInput(v.costPrice ? String(v.costPrice) : "");
                                setCostUpdateMsg(null);
                              }}
                              className="h-7 px-2 text-[10px] font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] rounded-[2px] transition-colors cursor-pointer"
                              title="Update actual purchase/landed cost"
                            >
                              Cost &plusmn;
                            </button>
                            <Link
                              href={`/admin/vehicles/${v.id}/edit`}
                              className="h-7 px-2 text-[10px] font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[2px] inline-flex items-center"
                              title="Edit vehicle details"
                            >
                              Edit
                            </Link>
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
      </div>

      {/* ========================================================= */}
      {/* 7. INLINE LANDED COST EDIT MODAL                          */}
      {/* ========================================================= */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4 rounded-[2px] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-3">
              <div>
                <Eyebrow>Financial Audit</Eyebrow>
                <h4 className="font-serif text-lg text-[var(--text-primary)] mt-0.5">
                  Set Purchase / Landed Cost
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[var(--text-primary)] font-medium">
                {editingVehicle.year} {editingVehicle.make} {editingVehicle.model}
              </p>
              <div className="flex justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                <span>Retail Price:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {editingVehicle.price ? formatFullLKR(editingVehicle.price) : "Call for Price"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Landed Import Cost in LKR (FOB + Freight + Duty + Port + Transport)
              </label>
              <input
                type="number"
                value={newCostInput}
                onChange={(e) => setNewCostInput(e.target.value)}
                placeholder="e.g. 24500000"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-mono rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-light mt-1 block">
                Leave blank to revert to the default {defaultMarginPercent}% dealership margin assumption.
              </span>
            </div>

            {/* Live Profit Preview */}
            {editingVehicle.price && newCostInput && (
              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Calculated Profit:</span>
                  <span className="font-semibold text-status-success">
                    {formatFullLKR(editingVehicle.price - Number(newCostInput))}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Net Margin:</span>
                  <span className="text-status-success font-semibold">
                    {(((editingVehicle.price - Number(newCostInput)) / editingVehicle.price) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {costUpdateMsg && (
              <div className="text-xs p-2 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--accent)] font-mono">
                {costUpdateMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingCost}
                onClick={handleSaveCost}
                className="px-6 py-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] cursor-pointer disabled:opacity-50"
              >
                {isUpdatingCost ? "Saving..." : "Save Landed Cost"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
