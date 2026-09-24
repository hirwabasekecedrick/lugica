"use client";

import React from "react";

/* ── Performance Overview Cards ─────────────────────────────── */
const perfCards = [
  { label: "Form Sub", value: "--", note: "Upgrade", noteType: "upgrade", icon: FormIcon },
  { label: "Views", value: "0", note: "No data yet", noteType: "info", icon: ViewsIcon },
  { label: "Unique Visitors", value: "--", note: "Upgrade", noteType: "upgrade", icon: VisitorsIcon },
  { label: "Conv. Rate", value: "--", note: "Upgrade", noteType: "upgrade", icon: ConvIcon },
];

/* ── Recommended Actions ─────────────────────────────────────── */
const recommendedActions = [
  { label: "Create your first page", href: "#" },
  { label: "Connect a custom domain", href: "#" },
  { label: "Set up conversion tracking", href: "#" },
];

export default function InventoryContent() {
  return (
    <div className="flex-1 overflow-y-auto px-7 pb-10 space-y-6 inventory-scroll">

      {/* ── PERFORMANCE OVERVIEW ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#6984A9] text-[11px] font-semibold uppercase tracking-widest">
            Performance Overview
          </span>
          <button className="flex items-center gap-1 text-[#6984A9] hover:text-[#EEFABD] text-xs transition-colors cursor-pointer">
            Full report
            <ExternalLinkIcon className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {perfCards.map((card) => (
            <div
              key={card.label}
              className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-[#6984A9]">
                <card.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <p className="text-white text-2xl font-bold">{card.value}</p>
              {card.noteType === "upgrade" ? (
                <button className="flex items-center gap-1 text-[#A0D585] text-xs hover:text-[#EEFABD] transition-colors cursor-pointer w-fit font-medium">
                  <UpgradeIcon className="w-3 h-3" />
                  Upgrade
                </button>
              ) : (
                <span className="text-[#6984A9]/70 text-xs">{card.note}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── PRIMARY INSIGHT CTA ───────────────────────────────── */}
      <section>
        <div className="bg-gradient-to-r from-[#131e36] via-[#1a2b4c] to-[#131e36] border border-[#263B6A] rounded-xl p-5 flex items-center justify-between gap-4 shadow-lg shadow-[#080d18]/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#A0D585] text-xs font-semibold uppercase tracking-wide">
                Primary Insight
              </span>
            </div>
            <h2 className="text-[#EEFABD] text-lg font-bold mb-1">Let&apos;s get you started</h2>
            <p className="text-[#6984A9] text-sm">
              Create your first page and start building your audience.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] text-sm font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0 shadow-md">
            Create a page
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ── INSIGHTS WARMING UP ───────────────────────────────── */}
      <section>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-6 flex flex-col items-center text-center">
          
          <h3 className="text-[#EEFABD] text-base font-bold mb-2">Your insights are warming up</h3>
          <p className="text-[#6984A9] text-sm max-w-xs mb-5">
            Publish a page and share it — we&apos;ll spot opportunities and surface your next best actions as visitors start arriving.
          </p>
          {/* Faint chart line */}
          <div className="w-full h-12 relative mb-5 overflow-hidden">
            <svg viewBox="0 0 400 48" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A0D585" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#A0D585" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 C50 38 100 36 150 32 C200 28 250 26 300 30 C350 34 380 36 400 34 L400 48 L0 48 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0 40 C50 38 100 36 150 32 C200 28 250 26 300 30 C350 34 380 36 400 34"
                fill="none"
                stroke="#A0D585"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          {/* Chip buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["Traffic alerts", "Conversion tips", "A/B test ideas"].map((chip) => (
              <button
                key={chip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131e36] border border-[#263B6A] hover:border-[#6984A9] text-[#6984A9] hover:text-[#EEFABD] text-xs font-medium rounded-full transition-colors cursor-pointer"
              >
                <ChipDotIcon className="w-3 h-3 text-[#A0D585]" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE: Top Pages + Analytics ───────────────── */}
      <section>
        <p className="text-[#6984A9] text-[11px] font-semibold uppercase tracking-widest mb-3">
          Performance
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Pages */}
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 min-h-[180px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#6984A9]">
                <BarChartIcon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Top Pages</span>
              </div>
              <button className="flex items-center gap-1 text-[#6984A9] hover:text-[#EEFABD] text-xs transition-colors cursor-pointer">
                View all
                <ExternalLinkIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <BarEmptyIcon className="w-10 h-10 text-[#263B6A]" />
              <p className="text-[#6984A9] text-sm">Your top pages will be ranked here</p>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 min-h-[180px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#6984A9]">
                <LineChartIcon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Analytics</span>
              </div>
              <button className="flex items-center gap-1 text-[#6984A9] hover:text-[#EEFABD] text-xs transition-colors cursor-pointer">
                Full report
                <ExternalLinkIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <BarEmptyIcon className="w-10 h-10 text-[#263B6A]" />
              <p className="text-[#6984A9] text-sm">Analytics appear after your first page view</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GROWTH ───────────────────────────────────────────── */}
      <section>
        <p className="text-[#6984A9] text-[11px] font-semibold uppercase tracking-widest mb-3">
          Growth
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recommended Actions */}
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6984A9]">
                Recommended Actions
              </span>
              <span className="text-[#6984A9]/70 text-xs">0/3 done</span>
            </div>
            <ul className="space-y-2">
              {recommendedActions.map((action) => (
                <li key={action.label}>
                  <button className="w-full flex items-center justify-between px-3 py-3 bg-[#131e36] hover:bg-[#1a2b4c] border border-[#263B6A] hover:border-[#6984A9] rounded-lg transition-colors group cursor-pointer text-left">
                    <div className="flex items-center gap-2.5">
                      <CheckCircleEmptyIcon className="w-4 h-4 text-[#6984A9]/60 group-hover:text-[#A0D585]" />
                      <span className="text-[#EEFABD] text-sm font-medium">{action.label}</span>
                    </div>
                    <ExternalLinkIcon className="w-3.5 h-3.5 text-[#6984A9] group-hover:text-[#EEFABD] transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Wins & Momentum */}
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[180px]">
            <p className="text-[#6984A9] text-[11px] font-semibold uppercase tracking-widest self-start mb-4">
              Wins &amp; Momentum
            </p>
            <StarIcon className="w-10 h-10 text-[#EEFABD] mb-3" />
            <h3 className="text-[#EEFABD] text-sm font-bold mb-1">Your first win is coming</h3>
            <p className="text-[#6984A9] text-xs">
              Publish and share a page to start earning achievements
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Inline SVG Icons ──────────────────────────────────────── */
function FormIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M6 7h8M6 10h8M6 13h4" strokeLinecap="round" />
    </svg>
  );
}
function ViewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}
function VisitorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}
function ConvIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
  );
}
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
function UpgradeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L7.586 8 4.293 4.707A1 1 0 015 3zm6 0a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L13.586 8l-3.293-3.293A1 1 0 0111 2z" clipRule="evenodd" />
    </svg>
  );
}
function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}
function LineChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 15l4-6 4 3 4-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BarEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="5" y="22" width="6" height="12" rx="1" />
      <rect x="17" y="14" width="6" height="20" rx="1" />
      <rect x="29" y="8" width="6" height="26" rx="1" />
    </svg>
  );
}
function CheckCircleEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
}
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
function ChipDotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="currentColor">
      <circle cx="6" cy="6" r="4" />
    </svg>
  );
}
