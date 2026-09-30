"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LugicaLogo from "../LugicaLogo";
import {
  useAdminProducts,
  useDeliveries,
  useGoodsReceipts,
  useLogout,
  useVehicles,
} from "@/lib/api/hooks";
import { useSession } from "@/app/lib/session-context";
import { roleLabel, stockState } from "@/lib/format";
import { hasRole, ADMIN_ROLES } from "@/lib/roles";
import { useToast } from "../ToastProvider";

type Tab = "overview" | "catalog" | "procurement";

interface InventorySidebarProps {
  activeTab?: Tab;
  onSelectTab?: (tab: Tab) => void;
  onOpenAddProduct?: () => void;
  onOpenProcure?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Warehouse sidebar, restored to the original mock design.
 *
 * Differences from the mock are data-only:
 *  - the role switcher is gone. It called `switchRole` in the fake store, which
 *    would now be a privilege-escalation control, so the role is read-only.
 *  - the hardcoded "Maurice I." / "Manager ID #4092" become the session's
 *    display name and email. The API exposes no name/phone (API-GAPS #1).
 *  - badges are real: low stock comes from the product list, the procurement
 *    count from goods receipts, and the cart count in the top bar.
 */
export default function InventorySidebar({
  activeTab = "overview",
  onSelectTab,
  onOpenAddProduct,
  onOpenProcure,
  mobileOpen = false,
  onCloseMobile,
}: InventorySidebarProps) {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

  const productsQuery = useAdminProducts();
  const receiptsQuery = useGoodsReceipts();
  const deliveriesQuery = useDeliveries();
  const vehiclesQuery = useVehicles();

  // Admin-only links; the API would reject these for other roles anyway.
  const isAdmin = hasRole(session, ADMIN_ROLES);

  const pendingDeliveries = (deliveriesQuery.data ?? []).filter(
    (d) => d.status === "PENDING",
  ).length;
  const activeVehicles = (vehiclesQuery.data ?? []).filter(
    (v) => v.status === "ACTIVE",
  ).length;

  const lowStockCount = (productsQuery.data ?? []).filter(
    (p) => p.status === "ACTIVE" && stockState(p.stockQuantity) !== "in-stock",
  ).length;
  const receiptCount = (receiptsQuery.data ?? []).length;

  async function handleSignOut() {
    // Replace, so the back button cannot return to an authenticated page.
    await logout.mutateAsync().catch(() => undefined);
    toast.info("Signed out", "See you next time.");
    router.replace("/login");
  }

  const handleTabClick = (tab: Tab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
      active
        ? "bg-accent text-text"
        : "text-text-muted hover:bg-sunken hover:text-text"
    }`;

  /** Same treatment as navItemClass, for real <Link> destinations. */
  const subLinkClass = (active: boolean) =>
    `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
      active
        ? "bg-accent text-text"
        : "text-text-muted hover:bg-sunken hover:text-text"
    }`;

  const adminLinks = [
    { href: "/admin/users", label: "Users & Drivers", icon: UsersIcon },
    { href: "/admin/vehicles", label: "Vehicles", icon: VehicleIcon, badge: activeVehicles },
    { href: "/admin/deliveries", label: "Deliveries", icon: DeliveryIcon, badge: pendingDeliveries },
    { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  ];

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
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sunken transition-colors"
              title="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Identity + role indicator. Read-only: role now comes from the JWT. */}
        {session && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-[11px] font-bold text-on-accent flex-shrink-0">
              {session.initials.charAt(0)}
            </div>
            <div className="truncate">
              <span className="text-text text-xs font-semibold block leading-tight truncate">
                {session.displayName}
              </span>
              <span className="text-[10px] text-text-accent font-mono capitalize">
                {roleLabel(session.role)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="px-4 py-3 relative">
        <button
          onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <CreateIcon className="w-4 h-4" />
            <span>New Action</span>
          </div>
          <ChevronDownIcon className="w-3 h-3" />
        </button>

        {createDropdownOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-surface border border-border rounded-xl p-1 shadow-2xl z-50 animate-fadeIn">
            <button
              onClick={() => {
                setCreateDropdownOpen(false);
                handleTabClick("catalog");
                if (onOpenAddProduct) onOpenAddProduct();
              }}
              className="w-full text-left px-3 py-2 hover:bg-sunken rounded-lg text-xs font-semibold text-text flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full text-left px-3 py-2 hover:bg-sunken rounded-lg text-xs font-semibold text-text-accent flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p className="text-text-muted/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            MANAGEMENT
          </p>
          <ul className="space-y-0.5">
            <li>
              <button onClick={() => handleTabClick("overview")} className={navItemClass(activeTab === "overview")}>
                <DashboardIcon className="w-4 h-4 flex-shrink-0" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabClick("catalog")}
                className={`${navItemClass(activeTab === "catalog")} justify-between`}
              >
                <div className="flex items-center gap-2.5">
                  <CatalogIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Inventory Catalog</span>
                </div>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold bg-warning/20 text-warning px-1.5 py-0.2 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabClick("procurement")}
                className={`${navItemClass(activeTab === "procurement")} justify-between`}
              >
                <div className="flex items-center gap-2.5">
                  <ProcurementIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Procurement</span>
                </div>
                <span className="text-[10px] font-bold bg-accent/20 text-text-accent px-1.5 py-0.2 rounded-full">
                  {receiptCount}
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Channels */}
        <div>
          <p className="text-text-muted/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            SALES CHANNELS
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/shop"
                onClick={onCloseMobile}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-text-muted hover:bg-sunken hover:text-text transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <StorefrontIcon className="w-4 h-4 flex-shrink-0 group-hover:text-text-accent" />
                  <span>Client Store</span>
                </div>
                <span className="text-[9px] font-bold bg-accent/20 text-text-accent border border-accent/30 px-1.5 py-0.5 rounded">
                  VIEW
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/checkout"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-text-muted hover:bg-sunken hover:text-text transition-colors"
              >
                <CheckoutIcon className="w-4 h-4 flex-shrink-0" />
                <span>Checkout Flow</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                onClick={onCloseMobile}
                className={subLinkClass(pathname === "/account")}
              >
                <AccountIcon className="w-4 h-4 flex-shrink-0" />
                <span>My Account</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Administration — ADMIN only, so the API never rejects these links */}
        {isAdmin && (
          <div>
            <p className="text-text-muted/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
              ADMINISTRATION
            </p>
            <ul className="space-y-0.5">
              {adminLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onCloseMobile}
                    className={subLinkClass(pathname === link.href)}
                  >
                    <div className="flex items-center gap-2.5">
                      <link.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </div>
                    {!!link.badge && (
                      <span className="text-[10px] font-bold bg-warning/20 text-warning px-1.5 py-0.2 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Warehouse Status banner */}
      <div className="px-4 py-2 bg-surface/60 border-t border-border/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Hub Status:</span>
          <span className="text-text-accent font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Operational
          </span>
        </div>
      </div>

      {/* Bottom user row */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-text to-text-muted flex items-center justify-center text-[11px] font-bold text-on-status flex-shrink-0">
            {session?.initials ?? "--"}
          </div>
          <div className="truncate">
            <span className="text-text-muted text-xs font-medium block truncate max-w-[90px]">
              {session?.displayName ?? "Signed out"}
            </span>
            <span className="text-[10px] text-text-muted block truncate max-w-[90px]">
              {session?.email ?? ""}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={logout.isPending}
          title="Sign out"
          aria-label="Sign out"
          className="text-text-muted hover:text-text transition-colors p-1 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-[210px] min-w-[210px] h-screen bg-page border-r border-border flex-col overflow-hidden select-none flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-overlay/40 backdrop-blur-sm transition-opacity animate-fadeIn"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-page border-r border-border shadow-2xl flex flex-col z-10 animate-slideRight">
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

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-7 8a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 9a3 3 0 100-6 3 3 0 000 6zM1 17v-1a5 5 0 0110 0v1H1zm12.5-7.6A2.5 2.5 0 1014.9 4a3 3 0 01-1.4 5.4zM14 17v-1a4.5 4.5 0 013.5-4.4V17H14z" />
    </svg>
  );
}

function VehicleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 12V7a1 1 0 011-1h9a1 1 0 011 1v5" strokeLinecap="round" />
      <path d="M2 12h16v3a1 1 0 01-1 1h-1.5" strokeLinecap="round" />
      <path d="M4 16H2.5A1.5 1.5 0 011 14.5V12" strokeLinecap="round" />
      <circle cx="6" cy="14" r="1.75" />
      <circle cx="14" cy="14" r="1.75" />
    </svg>
  );
}

function DeliveryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M10 17s5-4.6 5-8a5 5 0 10-10 0c0 3.4 5 8 5 8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="9" r="1.75" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 2.5h9L17 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-13a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 2.5V6h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10h7M6.5 13h5" strokeLinecap="round" />
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
