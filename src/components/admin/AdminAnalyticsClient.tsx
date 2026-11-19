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
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Branch Breakdown Analytics
  const branchAnalytics = useMemo(() => {
    const branches = [
      { key: "polonnaruwa", label: "Kaduruwela Main Showroom", location: "Polonnaruwa" },
      { key: "trincomalee", label: "Trincomalee Branch", location: "Eastern Coast" },
    ];

    return branches.map((b) => {
      const bVehicles = filteredVehicles.filter((v) => v.branch === b.key);
      const bSold = bVehicles.filter((v) => v.status === "sold");
      const bAvailable = bVehicles.filter((v) => v.status === "available");

      let revenue = 0;
      let cost = 0;
      let profit = 0;

      bSold.forEach((v) => {
        const f = getVehicleFinancials(v);
        revenue += f.retailPrice;
        cost += f.costPrice;
        profit += f.grossProfit;
      });

      let stockValue = 0;
      bAvailable.forEach((v) => {
        const f = getVehicleFinancials(v);
        stockValue += f.retailPrice;
      });

      const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;
      const bLeads = filteredLeads.filter((l) => l.branch === b.key);
      const bWonLeads = bLeads.filter((l) => l.stage === "won");

      return {
        ...b,
        soldCount: bSold.length,
        availableCount: bAvailable.length,
        revenue,
        cost,
        profit,
        margin,
        stockValue,
        leadsCount: bLeads.length,
        wonLeadsCount: bWonLeads.length,
      };
    });
  }, [filteredVehicles, filteredLeads, getVehicleFinancials]);

  // Make / Brand Breakdown Analytics
  const brandAnalytics = useMemo(() => {
    const brandMap = new Map<string, {
      make: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
      availableUnits: number;
    }>();

    filteredVehicles.forEach((v) => {
      const make = v.make;
      const f = getVehicleFinancials(v);
      const entry = brandMap.get(make) || {
        make,
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        availableUnits: 0,
      };

      if (v.status === "sold") {
        entry.unitsSold += 1;
        entry.revenue += f.retailPrice;
        entry.cost += f.costPrice;
        entry.profit += f.grossProfit;
      } else if (v.status === "available") {
        entry.availableUnits += 1;
      }

      brandMap.set(make, entry);
    });

    return Array.from(brandMap.values())
      .map((entry) => ({
        ...entry,
        margin: entry.revenue > 0 ? Math.round((entry.profit / entry.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredVehicles, getVehicleFinancials]);

  // Monthly Sales Trend (Last 5 Months)
  const monthlyTrend = useMemo(() => {
    const months = availableMonths.slice(0, 5).reverse();
    return months.map((m) => {
      const monthVehicles = vehicles.filter((v) => {
        const dStr = v.status === "sold" ? (v.updatedAt || v.createdAt) : v.createdAt;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return ym === m.key;
      });

      const sold = monthVehicles.filter((v) => v.status === "sold");
      let revenue = 0;
      let cost = 0;
      let profit = 0;

      sold.forEach((v) => {
        const f = getVehicleFinancials(v);
        revenue += f.retailPrice;
        cost += f.costPrice;
        profit += f.grossProfit;
      });

      return {
        key: m.key,
        label: m.label,
        soldCount: sold.length,
        revenue,
        cost,
        profit,
        margin: revenue > 0 ? Math.round((profit / revenue) * 10) / 10 : 0,
      };
    });
  }, [vehicles, availableMonths, getVehicleFinancials]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Executive Financial &amp; Profit Analytics</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Profitability &amp; Financial Performance
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Calculate gross vehicle sales, landed import costs, realized net profit, and stock valuation
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
            <span>Print Financial Statement</span>
          </button>

          <Link
            href="/admin/vehicles/new"
            className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px] shadow-sm"
          >
            + Register Vehicle
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

          {/* Showroom Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Branch:
            </span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-8 px-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-sans"
            >
              <option value="all">All Showrooms (Island-wide)</option>
              <option value="polonnaruwa">Kaduruwela Main Showroom</option>
              <option value="trincomalee">Trincomalee Coastal Branch</option>
            </select>
          </div>
        </div>

        {/* Profit Assumption / Landed Cost Controller */}
        <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>
              Active Filter: <strong className="text-[var(--text-primary)] font-medium">{periodTitle}</strong> &bull;{" "}
              {branchFilter === "all" ? "Both Branches" : branchFilter === "polonnaruwa" ? "Kaduruwela" : "Trincomalee"}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Estimated Margin for Unspecified Costs:</span>
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
      {/* 3. CORE FINANCIAL KPI STATS (6 CARDS)                     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Realized Gross Profit */}
        <div className="p-5 bg-[var(--bg-surface)] border border-emerald-500/30 rounded-[2px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-success font-semibold block">
            Realized Gross Profit
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {formatLKR(metrics.totalGrossProfit)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
            <span className="px-1.5 py-0.2 badge-status-success rounded-[1px] font-semibold">
              {metrics.overallMargin}% Margin
            </span>
            <span className="text-[var(--text-secondary)]">from {metrics.soldCount} sold</span>
          </div>
        </div>

        {/* Gross Sales Revenue */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)] font-semibold block">
            Gross Sales Revenue
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {formatLKR(metrics.totalRevenue)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-[var(--text-secondary)]">
            {metrics.soldCount} vehicle{metrics.soldCount === 1 ? "" : "s"} delivered
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] font-semibold block">
            Cost of Goods (COGS)
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {formatLKR(metrics.totalLandedCost)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
            Landed import cost basis
          </div>
        </div>

        {/* Average Profit Per Unit */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] font-semibold block">
            Avg Profit / Vehicle
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {metrics.soldCount > 0 ? formatLKR(metrics.averageProfitPerUnit) : "—"}
          </div>
          <div className="mt-1 text-[10px] font-mono text-status-success">
            {metrics.soldCount > 0 ? "Per vehicle delivered" : "No sold units in period"}
          </div>
        </div>

        {/* Active Lot Inventory Value */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-info font-semibold block">
            Lot Stock Value
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {formatLKR(metrics.availableStockValue)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-[var(--text-secondary)]">
            {metrics.availableCount} available showroom units
          </div>
        </div>

        {/* Incoming In-Transit Value */}
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-status-warning font-semibold block">
            In-Transit Fleet
          </span>
          <div className="mt-2 font-serif text-2xl text-[var(--text-primary)]">
            {formatLKR(metrics.incomingStockValue)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-[var(--text-secondary)]">
            {metrics.incomingCount} units on water / port
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. VISUAL BREAKDOWNS: TRENDS & BRANCH COMPARISON          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue & Profit Trend Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                Monthly Performance Trend
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)] mt-0.5">
                Revenue vs Cost vs Profit Progression
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Last {monthlyTrend.length} Months
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {monthlyTrend.map((m) => {
              const maxVal = Math.max(...monthlyTrend.map((item) => item.revenue || item.profit || 1), 50000000);
              const revPercent = Math.min(100, Math.max(8, (m.revenue / maxVal) * 100));
              const profitPercent = Math.min(100, Math.max(5, (m.profit / maxVal) * 100));

              return (
                <div key={m.key} className="space-y-1.5 p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-[var(--text-primary)]">{m.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-secondary)]">Sold: {m.soldCount}</span>
                      <span className="text-status-success font-semibold">{formatLKR(m.profit)} Profit</span>
                    </div>
                  </div>

                  {/* Revenue Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                      <span>Gross Sales: {formatLKR(m.revenue)}</span>
                      <span>Margin: {m.margin}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--border-subtle)] rounded-[1px] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-500 rounded-[1px]"
                        style={{ width: `${revPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Profit Sub-bar */}
                  <div className="space-y-1 pt-0.5">
                    <div className="w-full h-1.5 bg-[var(--border-subtle)] rounded-[1px] overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500 rounded-[1px]"
                        style={{ width: `${profitPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Profitability Comparison (5 Cols) */}
        <div className="lg:col-span-5 p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                Showroom Comparison
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)] mt-0.5">
                Branch Profit &amp; Inventory
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {branchAnalytics.map((b) => (
              <div
                key={b.key}
                className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif text-base font-medium text-[var(--text-primary)]">
                      {b.label}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                      {b.location}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase badge-status-success rounded-[1px] font-semibold">
                    {b.margin}% Margin
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-hairline)] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Revenue</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatLKR(b.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Net Profit</span>
                    <span className="font-semibold text-status-success">{formatLKR(b.profit)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Units Sold</span>
                    <span className="font-semibold text-[var(--text-primary)]">{b.soldCount} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Current Stock</span>
                    <span className="font-semibold text-status-info">{formatLKR(b.stockValue)} ({b.availableCount} cars)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MAKE/BRAND PROFITABILITY & PIPELINE ECONOMICS          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Brand Breakdown (7 Cols) */}
        <div className="lg:col-span-7 p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                Brand Profitability Ranking
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)] mt-0.5">
                Manufacturer Contribution (LKR)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {brandAnalytics.length} Brands
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  <th className="py-2.5 px-3">Manufacturer</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Sales</th>
                  <th className="py-2.5 px-3 text-right">Landed Cost</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)] font-mono">
                {brandAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)] italic">
                      No brand data matching current filters.
                    </td>
                  </tr>
                ) : (
                  brandAnalytics.map((b) => (
                    <tr key={b.make} className="hover:bg-[var(--bg-base)] transition-colors">
                      <td className="py-3 px-3 font-medium text-[var(--text-primary)]">
                        {b.make}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[1px]">
                          {b.unitsSold}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                        {formatLKR(b.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                        {formatLKR(b.cost)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-status-success">
                        {formatLKR(b.profit)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded-[1px] font-semibold text-[10px] ${
                          b.margin >= 15
                            ? "badge-status-success"
                            : b.margin >= 10
                            ? "badge-status-warning"
                            : "badge-status-neutral"
                        }`}>
                          {b.margin}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline & Lead Conversion Economics (5 Cols) */}
        <div className="lg:col-span-5 p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold block">
                Enquiry Conversion Economics
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)] mt-0.5">
                Lead-to-Sale Conversion
              </h3>
            </div>
            <Link
              href="/admin/leads?view=table"
              className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] hover:underline"
            >
              View Leads &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                Total Inquiries
              </span>
              <span className="font-serif text-2xl text-[var(--text-primary)] mt-1 block">
                {metrics.totalLeads}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">In selected period</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
              <span className="text-[10px] font-mono uppercase text-status-success font-semibold block">
                Won / Closed Deals
              </span>
              <span className="font-serif text-2xl text-status-success mt-1 block">
                {metrics.wonLeadsCount}
              </span>
              <span className="text-[10px] font-mono text-status-success opacity-85">
                {metrics.winRate}% Win Rate
              </span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-secondary)]">Revenue per Won Customer:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {metrics.wonLeadsCount > 0 ? formatLKR(metrics.totalRevenue / metrics.wonLeadsCount) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-secondary)]">Gross Profit per Won Customer:</span>
              <span className="font-semibold text-status-success">
                {metrics.wonLeadsCount > 0 ? formatLKR(metrics.totalGrossProfit / metrics.wonLeadsCount) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-secondary)]">Active Pipeline Enquiries:</span>
              <span className="font-semibold text-status-warning">
                {metrics.totalLeads - metrics.wonLeadsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. VEHICLE PROFIT & LOSS LEDGER (DATA TABLE)              */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Eyebrow>Financial Ledger</Eyebrow>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] mt-0.5">
              Vehicle Inventory &amp; Sales Profit Ledger
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
              Itemized selling prices, landed import costs, realized profit, and margins across each stock unit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
            >
              <option value="all">All Statuses ({filteredVehicles.length})</option>
              <option value="sold">Sold Units ({metrics.soldCount})</option>
              <option value="available">Available Stock ({metrics.availableCount})</option>
              <option value="reserved">Reserved Units ({metrics.reservedCount})</option>
              <option value="incoming">Incoming Fleet ({metrics.incomingCount})</option>
            </select>

            {/* Keyword Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by make, model, chassis..."
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
