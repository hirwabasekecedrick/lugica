"use client";

import React, { useState } from "react";
import Link from "next/link";
import LugicaLogo from "../LugicaLogo";
import { useStore } from "../../lib/store";

interface InventorySidebarProps {
  activeTab?: "overview" | "catalog" | "procurement";
  onSelectTab?: (tab: "overview" | "catalog" | "procurement") => void;
  onOpenAddProduct?: () => void;
  onOpenProcure?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function InventorySidebar({
  activeTab = "overview",
  onSelectTab,
  onOpenAddProduct,
  onOpenProcure,
  mobileOpen = false,
  onCloseMobile,
}: InventorySidebarProps) {
  const { currentRole, switchRole, procurementBatches, products } = useStore();
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const lowStockCount = products.filter((p) => p.status === "low-stock").length;

  const handleTabClick = (tab: "overview" | "catalog" | "procurement") => {
    if (onSelectTab) onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Logo + User header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <LugicaLogo />
          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors"
              title="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* User selector & Role indicator */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#263B6A]/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#263B6A] flex items-center justify-center text-[11px] font-bold text-[#A0D585] flex-shrink-0">
                M
              </div>
              <div className="truncate">
                <span className="text-[#EEFABD] text-xs font-semibold block leading-tight truncate">
                  Maurice I.
                </span>
                <span className="text-[10px] text-[#A0D585] font-mono capitalize">
                  {currentRole.replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronDownIcon className="w-3 h-3 text-[#6984A9] flex-shrink-0" />
          </button>

          {/* Role selector dropdown */}
          {roleMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#131e36] border border-[#263B6A] rounded-xl p-1.5 shadow-2xl z-50 animate-fadeIn text-xs">
              <p className="text-[10px] font-semibold text-[#6984A9] uppercase px-2 py-1">
                Switch Active Role
              </p>
              {(["shop_manager", "admin", "client"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium capitalize flex items-center justify-between transition-colors cursor-pointer ${
                    currentRole === r
                      ? "bg-[#263B6A] text-[#EEFABD]"
                      : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-white"
                  }`}
                >
                  <span>{r.replace("_", " ")}</span>
                  {currentRole === r && (
                    <svg className="w-3.5 h-3.5 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 py-3 relative">
        <button
          onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <CreateIcon className="w-4 h-4" />
            <span>New Action</span>
          </div>
          <ChevronDownIcon className="w-3 h-3" />
        </button>

        {createDropdownOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-[#131e36] border border-[#263B6A] rounded-xl p-1 shadow-2xl z-50 animate-fadeIn">
            <button
              onClick={() => {
                setCreateDropdownOpen(false);
                handleTabClick("catalog");
                if (onOpenAddProduct) onOpenAddProduct();
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#263B6A]/40 rounded-lg text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Add New Product</span>
            </button>
            <button
              onClick={() => {
                setCreateDropdownOpen(false);
                handleTabClick("procurement");
                if (onOpenProcure) onOpenProcure();
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#263B6A]/40 rounded-lg text-xs font-semibold text-[#A0D585] flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Procure Stock Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 inventory-scroll">
        {/* Core Management */}
        <div>
          <p className="text-[#6984A9]/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            MANAGEMENT
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => handleTabClick("overview")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  activeTab === "overview"
                    ? "bg-[#263B6A] text-[#EEFABD]"
                    : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD]"
                }`}
              >
                <DashboardIcon className="w-4 h-4 flex-shrink-0" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabClick("catalog")}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  activeTab === "catalog"
                    ? "bg-[#263B6A] text-[#EEFABD]"
                    : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CatalogIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Inventory Catalog</span>
                </div>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabClick("procurement")}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  activeTab === "procurement"
                    ? "bg-[#263B6A] text-[#EEFABD]"
                    : "text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ProcurementIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Procurement</span>
                </div>
                <span className="text-[10px] font-bold bg-[#A0D585]/20 text-[#A0D585] px-1.5 py-0.2 rounded-full">
                  {procurementBatches.length}
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Channels */}
        <div>
          <p className="text-[#6984A9]/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            SALES CHANNELS
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/shop"
                onClick={onCloseMobile}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <StorefrontIcon className="w-4 h-4 flex-shrink-0 group-hover:text-[#A0D585]" />
                  <span>Client Store</span>
                </div>
                <span className="text-[9px] font-bold bg-[#A0D585]/20 text-[#A0D585] border border-[#A0D585]/30 px-1.5 py-0.5 rounded">
                  VIEW
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/checkout"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-[#EEFABD] transition-colors"
              >
                <CheckoutIcon className="w-4 h-4 flex-shrink-0" />
                <span>Checkout Flow</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Warehouse Status banner */}
      <div className="px-4 py-2 bg-[#131e36]/60 border-t border-[#263B6A]/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#6984A9]">Hub Status:</span>
          <span className="text-[#A0D585] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A0D585] animate-pulse" />
            Operational
          </span>
        </div>
      </div>

      {/* Bottom user row */}
      <div className="border-t border-[#263B6A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#263B6A] to-[#6984A9] flex items-center justify-center text-[11px] font-bold text-[#EEFABD] flex-shrink-0">
            MI
          </div>
          <div className="truncate">
            <span className="text-[#c0c1d4] text-xs font-medium block truncate max-w-[90px]">
              Maurice IRAGABA
            </span>
            <span className="text-[10px] text-[#6984A9] block">Manager ID #4092</span>
          </div>
        </div>
        <Link
          href="/login"
          title="Sign out / Switch user"
          className="text-[#6984A9] hover:text-[#EEFABD] transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-[210px] min-w-[210px] h-screen bg-[#0d1525] border-r border-[#263B6A] flex-col overflow-hidden select-none flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-[#0d1525] border-r border-[#263B6A] shadow-2xl flex flex-col z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Inline SVG Icons ──────────────────────────────────────── */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function CatalogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M2 7h16" strokeLinecap="round" />
      <path d="M6 3v4" strokeLinecap="round" />
    </svg>
  );
}

function ProcurementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 4h12v12H4z" strokeLinecap="round" />
      <path d="M10 2v6m0 0l-2-2m2 2l2-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13h6" strokeLinecap="round" />
    </svg>
  );
}

function StorefrontIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
  );
}

function CheckoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h3a1 1 0 100-2H9z" clipRule="evenodd" />
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
