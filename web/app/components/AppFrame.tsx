"use client";

import React, { useState } from "react";
import AppSidebarNav, {
  SALES_CHANNEL_LINKS,
  type SidebarGroup,
  type SidebarItem,
} from "./AppSidebarNav";
import { MenuIcon } from "./sidebar-icons";

/**
 * Page frame for the route-based staff surfaces (/admin/*, /driver).
 *
 * It renders the same AppSidebarNav as /inventory, so navigation, spacing and
 * the identity/footer block are identical across every staff route. The
 * sales-channel group is appended here because those destinations are the same
 * on every surface.
 *
 * Callers pass grouped nav via `sidebarGroups`. The former flat `sidebarItems`
 * + `activeHref` pair is gone: its only consumer was /driver1, which was a
 * duplicate of /driver and has been removed.
 */
export function AppFrame({
  title,
  subtitle,
  children,
  sidebarGroups,
  quickActions,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Grouped nav for this surface, without the shared sales-channel group. */
  sidebarGroups?: SidebarGroup[];
  quickActions?: React.ComponentProps<typeof AppSidebarNav>["quickActions"];
  actions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups: SidebarGroup[] = [
    ...(sidebarGroups ?? []),
    { title: "SALES CHANNELS", items: SALES_CHANNEL_LINKS },
  ];

  return (
    <div className="flex h-screen w-full bg-page overflow-hidden text-text font-sans">
      <AppSidebarNav
        groups={groups}
        quickActions={quickActions}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 px-4 sm:px-6 border-b border-border bg-page/80 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text cursor-pointer"
            title="Open sidebar navigation"
            aria-label="Open sidebar navigation"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-text truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-text-muted truncate">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 inventory-scroll">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}