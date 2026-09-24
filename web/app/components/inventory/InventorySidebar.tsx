"use client";

import React, { useState } from "react";
import Link from "next/link";
import LugicaLogo from "../LugicaLogo";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  active: boolean;
  badge?: string;
};

type NavGroup = {
  section: string | null;
  items: NavItem[];
};

const navItems: NavGroup[] = [
  {
    section: null,
    items: [{ label: "Home", icon: HomeIcon, href: "/inventory", active: true }],
  },
  {
    section: "CREATE",
    items: [
      { label: "Pages", icon: PagesIcon, href: "#", active: false },
      { label: "Sites", icon: SitesIcon, href: "#", active: false },
      { label: "Pop-ups", icon: PopupsIcon, href: "#", active: false },
      { label: "Ads", icon: AdsIcon, href: "#", active: false, badge: "BETA" },
    ],
  },
  {
    section: "ANALYZE",
    items: [
      { label: "Analytics", icon: AnalyticsIcon, href: "#", active: false },
      { label: "Leads", icon: LeadsIcon, href: "#", active: false },
    ],
  },
];

export default function InventorySidebar() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <aside className="w-[190px] min-w-[190px] h-screen bg-[#0d1525] border-r border-[#263B6A] flex flex-col overflow-hidden select-none">
      {/* Logo + User header */}
      <div className="px-4 pt-4 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-3">
          <LugicaLogo />
        </div>

        {/* User selector */}
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#263B6A]/40 transition-colors text-left group">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#263B6A] flex items-center justify-center text-[10px] font-bold text-[#A0D585] flex-shrink-0">
              M
            </div>
            <span className="text-[#6984A9] text-xs font-medium truncate max-w-[100px]">
              Maurice IRAGABA
            </span>
          </div>
          <ChevronDownIcon className="w-3 h-3 text-[#6984A9] flex-shrink-0" />
        </button>
      </div>

      {/* Create button */}
      <div className="px-4 py-3">
        <button
          onClick={() => setCreateOpen(!createOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <CreateIcon className="w-4 h-4" />
            <span>Create</span>
          </div>
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 inventory-scroll">
        {navItems.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="text-[#6984A9]/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-[#263B6A] text-[#EEFABD]"
                        : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD]"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-bold bg-[#A0D585]/20 text-[#A0D585] border border-[#A0D585]/30 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Credits */}
      <div className="px-5 py-2">
        <p className="text-[#6984A9]/50 text-[11px]">5,000 credits</p>
      </div>

      {/* Bottom user row */}
      <div className="border-t border-[#263B6A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#263B6A] to-[#6984A9] flex items-center justify-center text-[11px] font-bold text-[#EEFABD] flex-shrink-0">
            MI
          </div>
          <span className="text-[#6984A9] text-xs font-medium truncate max-w-[90px]">
            Maurice IRAGABA
          </span>
        </div>
        <button className="text-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer">
          <ChevronUpDownIcon className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

/* ─── Inline SVG Icons ──────────────────────────────────────── */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}
function PagesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <path d="M6 6h8M6 10h8M6 14h4" strokeLinecap="round" />
    </svg>
  );
}
function SitesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M2 7h16" strokeLinecap="round" />
      <path d="M6 3v4" strokeLinecap="round" />
    </svg>
  );
}
function PopupsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <path d="M6 5V3.5A1.5 1.5 0 017.5 2h5A1.5 1.5 0 0114 3.5V5" strokeLinecap="round" />
      <path d="M7 10h6M7 13h4" strokeLinecap="round" />
    </svg>
  );
}
function AdsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 10h4M13 10h4M10 3v4M10 13v4" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}
function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}
function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  );
}
function CreateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M10 7v6M7 10h6" strokeLinecap="round" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
function ChevronUpDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
