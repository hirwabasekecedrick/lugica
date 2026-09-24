"use client";

import React, { useState } from "react";

const tabs = [
  { label: "Lead Gen", active: true, soon: false },
  { label: "Ecommerce", active: false, soon: true },
  { label: "CTR", active: false, soon: true },
];

const dateRanges = ["Last 7 days", "Last 30 days", "Last 90 days"];

export default function InventoryTopBar() {
  const [activeTab, setActiveTab] = useState("Lead Gen");
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [dateOpen, setDateOpen] = useState(false);

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const day = now.getDate();
  const greeting = now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening";

  return (
    <header className="flex-shrink-0 px-7 pt-6 pb-4 flex items-start justify-between gap-4">
      {/* Left: greeting */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">
          Good {greeting}, Maurice 👋
        </h1>
        <p className="text-[#6b6c80] text-sm mt-0.5">
          {dayName}, {monthName} {day}
        </p>
      </div>

      {/* Right: tabs + date picker + customize */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Tab group */}
        <div className="flex items-center bg-[#1a1b28] border border-[#2a2b3d] rounded-lg p-0.5 gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => !tab.soon && setActiveTab(tab.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.label && !tab.soon
                  ? "bg-[#2d2e44] text-white shadow"
                  : "text-[#6b6c80] hover:text-white"
              } ${tab.soon ? "cursor-default" : "cursor-pointer"}`}
            >
              {tab.label}
              {tab.soon && (
                <span className="text-[9px] font-bold bg-[#2d2e44] text-[#6b6c80] px-1 py-0.5 rounded uppercase tracking-wide">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b28] border border-[#2a2b3d] rounded-lg text-[#c0c1d4] text-xs font-medium hover:border-[#3a3b50] transition-colors cursor-pointer"
          >
            {dateRange}
            <ChevronDownIcon className="w-3 h-3 text-[#6b6c80]" />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#1a1b28] border border-[#2a2b3d] rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden">
              {dateRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => { setDateRange(r); setDateOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    r === dateRange ? "text-white bg-[#2d2e44]" : "text-[#8b8c9e] hover:bg-[#222330] hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customize */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-[#8b8c9e] hover:text-white text-xs font-medium transition-colors cursor-pointer">
          <CustomizeIcon className="w-4 h-4" />
          Customize
        </button>
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
function CustomizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="10" cy="10" r="2" />
      <path d="M10 4v2M10 14v2M4 10H2M18 10h-2M6.34 6.34 4.93 4.93M15.07 15.07l-1.41-1.41M6.34 13.66l-1.41 1.41M15.07 4.93l-1.41 1.41" strokeLinecap="round" />
    </svg>
  );
}
