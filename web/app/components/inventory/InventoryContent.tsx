"use client";

import React, { useState } from "react";
import { useStore } from "../../lib/store";
import ProductIcon from "./ProductIcon";

interface InventoryContentProps {
  onNavigateToCatalog?: () => void;
  onNavigateToProcurement?: (productId?: string) => void;
}

export default function InventoryContent({
  onNavigateToCatalog,
  onNavigateToProcurement,
}: InventoryContentProps) {
  const { products, procurementBatches, orders } = useStore();
  const [activeTimeframe, setActiveTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  // Dynamic calculations from store
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const lowStockProducts = products.filter((p) => p.status === "low-stock" || p.status === "out-of-stock");

  // Category breakdown calculation
  const categoryStats = products.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { count: 0, units: 0, value: 0 };
    }
    acc[p.category].count += 1;
    acc[p.category].units += p.stock;
    acc[p.category].value += p.stock * p.price;
    return acc;
  }, {} as Record<string, { count: number; units: number; value: number }>);

  const categories = Object.entries(categoryStats);

  // Inflow vs Outflow monthly chart data (Units restocked vs units dispatched)
  const chartData = [
    { month: "Apr", inbound: 120, outbound: 95 },
    { month: "May", inbound: 160, outbound: 140 },
    { month: "Jun", inbound: 210, outbound: 190 },
    { month: "Jul", inbound: 180, outbound: 175 },
    { month: "Aug", inbound: 250, outbound: 230 },
    { month: "Sep", inbound: 290, outbound: 260 },
  ];

  const maxChartValue = Math.max(...chartData.map((d) => Math.max(d.inbound, d.outbound)));

  return (
    <div className="space-y-6">
      {/* ── KPI METRICS CARDS ─────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Value */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#6984A9] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Value</span>
            <span className="p-1.5 rounded-lg bg-[#263B6A]/50 text-[#A0D585]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-[#EEFABD]">
              ${totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#A0D585] font-bold">Cost base: ${totalCostValue.toFixed(0)}</span>
              <span className="text-[#6984A9]">&bull; Retail value</span>
            </div>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#6984A9] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Warehouse Units</span>
            <span className="p-1.5 rounded-lg bg-[#263B6A]/50 text-[#EEFABD]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-white">{totalStockUnits}</p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#A0D585] font-semibold">{products.length} active SKUs</span>
              <span className="text-[#6984A9]">&bull; Ready to dispatch</span>
            </div>
          </div>
        </div>

        {/* Fulfillment & Dispatch Rate */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#6984A9] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fulfillment Rate</span>
            <span className="p-1.5 rounded-lg bg-[#263B6A]/50 text-[#A0D585]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-[#A0D585]">99.4%</p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#A0D585] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A0D585] animate-ping" />
                Live SLA
              </span>
              <span className="text-[#6984A9]">&bull; Avg dispatch 1.2 hrs</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#6984A9] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Restock Alerts</span>
            <span className={`p-1.5 rounded-lg bg-[#263B6A]/50 ${lowStockProducts.length > 0 ? "text-amber-400" : "text-[#A0D585]"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-black ${lowStockProducts.length > 0 ? "text-amber-400" : "text-[#A0D585]"}`}>
              {lowStockProducts.length} {lowStockProducts.length === 1 ? "Item" : "Items"}
            </p>
            <div className="flex items-center gap-1 text-[11px]">
              {lowStockProducts.length > 0 ? (
                <button
                  onClick={() => onNavigateToProcurement && onNavigateToProcurement()}
                  className="text-amber-300 hover:text-[#EEFABD] font-semibold underline cursor-pointer"
                >
                  Review procurement needs →
                </button>
              ) : (
                <span className="text-[#A0D585]">Optimal stock health</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS SECTION: INBOUND VS OUTBOUND FLOW & CATEGORY BREAKDOWN ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2 Cols): Inflow vs Outflow Bar Chart */}
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-white text-sm font-bold tracking-tight">
                Inventory Logistics Flow (Inbound vs Outbound)
              </h3>
              <p className="text-xs text-[#6984A9]">
                Monthly supplier restock batches vs courier parcel fulfillments (units)
              </p>
            </div>

            {/* Timeframe pill selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#131e36] border border-[#263B6A] rounded-lg p-0.5 text-xs font-semibold">
                {(["7d", "30d", "90d"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTimeframe(t)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTimeframe === t
                        ? "bg-[#263B6A] text-[#EEFABD]"
                        : "text-[#6984A9] hover:text-white"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Visual Chart */}
          <div className="relative h-56 w-full flex flex-col justify-end pt-4">
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-[#6984A9]" />
              <div className="border-b border-[#6984A9]" />
              <div className="border-b border-[#6984A9]" />
              <div className="border-b border-[#6984A9]" />
            </div>

            {/* Bars container */}
            <div className="relative z-10 flex items-end justify-between gap-2 h-44 px-3">
              {chartData.map((d) => {
                const inboundHeight = (d.inbound / maxChartValue) * 100;
                const outboundHeight = (d.outbound / maxChartValue) * 100;

                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#131e36] border border-[#263B6A] text-[10px] text-white px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap mb-1">
                      <p className="text-[#A0D585] font-bold">In: {d.inbound} units</p>
                      <p className="text-[#6984A9]">Out: {d.outbound} units</p>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Inbound Bar */}
                      <div
                        className="w-3.5 sm:w-5 bg-[#A0D585] hover:bg-[#EEFABD] rounded-t-md transition-all duration-300 shadow-sm"
                        style={{ height: `${inboundHeight}%` }}
                        title={`${d.month} Inbound: ${d.inbound} units`}
                      />
                      {/* Outbound Bar */}
                      <div
                        className="w-3.5 sm:w-5 bg-[#263B6A] hover:bg-[#6984A9] rounded-t-md transition-all duration-300 border-t border-[#6984A9]/40 shadow-sm"
                        style={{ height: `${outboundHeight}%` }}
                        title={`${d.month} Outbound: ${d.outbound} units`}
                      />
                    </div>

                    {/* Month Label */}
                    <span className="text-[11px] font-semibold text-[#6984A9] group-hover:text-white transition-colors">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-[#263B6A]/50 text-xs mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#A0D585]" />
              <span className="text-[#6984A9]">Inbound Procurement Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#263B6A] border border-[#6984A9]" />
              <span className="text-[#6984A9]">Outbound Courier Dispatches</span>
            </div>
          </div>
        </div>

        {/* Right (1 Col): Stock by Category Breakdown */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-bold tracking-tight">Stock by Category</h3>
              <span className="text-[10px] text-[#A0D585] font-semibold px-2 py-0.5 rounded bg-[#A0D585]/10 border border-[#A0D585]/30">
                {categories.length} Categories
              </span>
            </div>

            <div className="space-y-4">
              {categories.map(([cat, stats], idx) => {
                const percentOfUnits = totalStockUnits > 0 ? (stats.units / totalStockUnits) * 100 : 0;
                const colors = ["#A0D585", "#EEFABD", "#6984A9", "#3b5b99"];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-white">{cat}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#EEFABD]">{stats.units} units</span>
                        <span className="text-[#6984A9] text-[10px] ml-1.5">({percentOfUnits.toFixed(0)}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[#131e36] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentOfUnits}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick summary footer */}
          <div className="mt-6 pt-4 border-t border-[#263B6A]/50 bg-[#131e36]/40 -mx-5 -mb-5 p-4 rounded-b-xl flex items-center justify-between text-xs">
            <span className="text-[#6984A9]">Procurement Batches Logged:</span>
            <span className="font-bold text-[#A0D585]">{procurementBatches.length} shipments</span>
          </div>
        </div>
      </section>

      {/* ── BOTTOM ROW: RESTOCK PRIORITIES & RECENT INVENTORY ACTIVITY ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Restock Priorities */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <h3 className="text-white text-sm font-bold tracking-tight">Stock Replenishment Queue</h3>
              </div>
              {onNavigateToCatalog && (
                <button
                  onClick={onNavigateToCatalog}
                  className="text-xs text-[#A0D585] hover:text-[#EEFABD] font-medium transition-colors cursor-pointer"
                >
                  View full catalog →
                </button>
              )}
            </div>
            <p className="text-xs text-[#6984A9] mb-4">
              SKUs reaching critical minimums or out of stock that require supplier purchase orders.
            </p>

            <div className="space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center bg-[#131e36]/30 border border-[#263B6A]/50 rounded-xl">
                  <p className="text-xs text-[#A0D585] font-semibold">All items are above safety minimums</p>
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#131e36] border border-[#263B6A] rounded-xl flex items-center justify-between gap-3 hover:border-[#6984A9] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#0d1525] border border-[#263B6A] flex items-center justify-center text-[#A0D585]">
                        <ProductIcon name={p.image || p.name} category={p.category} className="w-4 h-4 text-[#A0D585]" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                        <span className="text-[10px] text-[#6984A9] font-mono">{p.sku}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-bold block ${p.stock === 0 ? "text-rose-400" : "text-amber-300"}`}>
                          {p.stock} / {p.minStockThreshold} units
                        </span>
                        <span className="text-[10px] text-[#6984A9]">
                          {p.stock === 0 ? "Out of stock" : "Low stock"}
                        </span>
                      </div>
                      {onNavigateToProcurement && (
                        <button
                          onClick={() => onNavigateToProcurement(p.id)}
                          className="px-2.5 py-1.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          + Procure
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Inbound & Dispatch Movements */}
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-bold tracking-tight">Recent Inventory Movements</h3>
              <span className="text-[10px] text-[#6984A9] font-mono">Live Activity Log</span>
            </div>
            <p className="text-xs text-[#6984A9] mb-4">
              Real-time audit log of stock entries, supplier receipts, and parcel dispatch checks.
            </p>

            <div className="space-y-3">
              {procurementBatches.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#131e36]/40 border border-[#263B6A]/40">
                  <span className="w-7 h-7 rounded-lg bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      Restocked {b.productName}
                    </p>
                    <p className="text-[10px] text-[#6984A9]">
                      Batch <span className="font-mono text-[#EEFABD]">{b.batchNumber}</span> &bull; Supplier: {b.supplierName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-[#A0D585]">+{b.quantityReceived}</span>
                    <span className="text-[10px] text-[#6984A9] block">units</span>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#131e36]/40 border border-[#263B6A]/40">
                <span className="w-7 h-7 rounded-lg bg-[#6984A9]/15 text-[#6984A9] border border-[#6984A9]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h8m-8 4h5m2 6a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4zm10-7h3l3 4v3h-2m-14 0H3V5a1 1 0 011-1h11a1 1 0 011 1v11" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    Courier Route Dispatch #902
                  </p>
                  <p className="text-[10px] text-[#6984A9]">
                    Kigali Central Sector &bull; 14 outbound parcels allocated
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-[#6984A9]">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#263B6A]/50 flex items-center justify-between text-xs text-[#6984A9]">
            <span>System Telemetry:</span>
            <span className="text-[#A0D585] font-semibold">All warehouse RFID sensors online</span>
          </div>
        </div>
      </section>
    </div>
  );
}
