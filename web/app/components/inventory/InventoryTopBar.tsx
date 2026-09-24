"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";

interface InventoryTopBarProps {
  activeTab?: "overview" | "catalog" | "procurement";
  onSelectTab?: (tab: "overview" | "catalog" | "procurement") => void;
}

const dateRanges = ["Last 7 days", "Last 30 days", "Last 90 days"];

export default function InventoryTopBar({
  activeTab = "overview",
  onSelectTab,
}: InventoryTopBarProps) {
  const { currentRole, cart } = useStore();
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [dateOpen, setDateOpen] = useState(false);

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const day = now.getDate();
  const greeting =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
      ? "afternoon"
      : "evening";

  const tabs: { id: "overview" | "catalog" | "procurement"; label: string }[] = [
    { id: "overview", label: "Dashboard" },
    { id: "catalog", label: "Inventory Catalog" },
    { id: "procurement", label: "Procurement Batches" },
  ];

  return (
    <header className="flex-shrink-0 px-7 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#263B6A]/60 bg-[#0d1525]/50">
      {/* Left: greeting */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[#EEFABD] text-xl font-bold tracking-tight">
            Good {greeting}, Maurice
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30 uppercase">
            {currentRole.replace("_", " ")}
          </span>
        </div>
        <p className="text-[#6984A9] text-xs mt-0.5">
          {dayName}, {monthName} {day} &bull; Lugica Express Central Hub
        </p>
      </div>

      {/* Right: Tab switchers, Client Shop shortcut, and Date picker */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#0d1525] border border-[#263B6A] rounded-lg p-0.5 gap-0.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#263B6A] text-[#EEFABD] shadow"
                  : "text-[#6984A9] hover:text-[#EEFABD]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Client Storefront button */}
        <Link
          href="/shop"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] rounded-lg text-xs font-semibold text-[#A0D585] hover:text-[#EEFABD] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          <span>Client Store</span>
          {cart.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#A0D585] text-[#0d1525] text-[10px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Link>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1525] border border-[#263B6A] rounded-lg text-[#6984A9] text-xs font-medium hover:border-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer"
          >
            {dateRange}
            <ChevronDownIcon className="w-3 h-3" />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#0d1525] border border-[#263B6A] rounded-lg shadow-2xl z-50 min-w-[140px] overflow-hidden animate-fadeIn">
              {dateRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setDateRange(r);
                    setDateOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    r === dateRange
                      ? "text-[#EEFABD] bg-[#263B6A]"
                      : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
