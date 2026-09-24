"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";

interface InventoryTopBarProps {
  activeTab?: "overview" | "catalog" | "procurement";
  onSelectTab?: (tab: "overview" | "catalog" | "procurement") => void;
  onOpenMobileMenu?: () => void;
}

const dateRanges = ["Last 7 days", "Last 30 days", "Last 90 days"];

export default function InventoryTopBar({
  activeTab = "overview",
  onSelectTab,
  onOpenMobileMenu,
}: InventoryTopBarProps) {
  const { currentRole, cart } = useStore();
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [dateOpen, setDateOpen] = useState(false);

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = now.toLocaleDateString("en-US", { month: "short" });
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
    <header className="flex-shrink-0 px-4 py-3 sm:px-7 sm:pt-5 sm:pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#263B6A]/60 bg-[#0d1525]/60 backdrop-blur-md">
      {/* Top / Left: Mobile toggle + greeting */}
      <div className="flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu toggle */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg bg-[#131e36] border border-[#263B6A] text-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer"
              title="Open sidebar navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[#EEFABD] text-base sm:text-xl font-bold tracking-tight">
                Good {greeting}, Maurice
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30 uppercase">
                {currentRole.replace("_", " ")}
              </span>
            </div>
            <p className="text-[#6984A9] text-[11px] sm:text-xs">
              {dayName}, {monthName} {day} &bull; Lugica Express Central Hub
            </p>
          </div>
        </div>

        {/* Client Store button on mobile right */}
        <Link
          href="/shop"
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131e36] border border-[#263B6A] rounded-lg text-xs font-semibold text-[#A0D585] hover:text-[#EEFABD]"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          <span>Shop</span>
          {cart.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#A0D585] text-[#0d1525] text-[10px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Link>
      </div>

      {/* Right / Bottom: Tabs & controls */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 md:pb-0 inventory-scroll">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#0d1525] border border-[#263B6A] rounded-lg p-0.5 gap-0.5 shadow-sm flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#263B6A] text-[#EEFABD] shadow"
                  : "text-[#6984A9] hover:text-[#EEFABD]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Client Storefront button (Desktop) */}
        <Link
          href="/shop"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] rounded-lg text-xs font-semibold text-[#A0D585] hover:text-[#EEFABD] transition-colors flex-shrink-0"
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
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#0d1525] border border-[#263B6A] rounded-lg text-[#6984A9] text-xs font-medium hover:border-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">{dateRange}</span>
            <span className="sm:hidden">7d</span>
            <ChevronDownIcon className="w-3 h-3" />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#0d1525] border border-[#263B6A] rounded-lg shadow-2xl z-50 min-w-[130px] overflow-hidden animate-fadeIn">
              {dateRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setDateRange(r);
                    setDateOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
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
