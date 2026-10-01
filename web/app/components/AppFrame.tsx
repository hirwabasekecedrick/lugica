"use client";

import React, { useState } from "react";
import AppSidebarNav, {
  SALES_CHANNEL_LINKS,
  type SidebarGroup,
  type SidebarItem,
} from "./AppSidebarNav";
import { MenuIcon } from "./sidebar-icons";

/** Flat, icon-less item shape still used by the /driver1 pages. */
export interface LegacySidebarItem {
  href: string;
  label: string;
  badge?: number;
  icon?: React.ElementType;
}

/**
 * Page frame for the route-based staff surfaces (/admin/*, /driver).
 *
 * It renders the same AppSidebarNav as /inventory, so navigation, spacing and
 * the identity/footer block are identical across every staff route. The
 * sales-channel group is appended here because those destinations are the same
 * on every surface.
 *
 * Callers pass `sidebarGroups` for grouped, icon-bearing nav. The older
 * `sidebarItems` + `activeHref` pair is still accepted and is rendered through
 * the same component as a single unlabelled group, so the /driver1 pages keep
 * working without being rewritten.
 */
export function AppFrame({
  title,
  subtitle,
  children,
  sidebarGroups,
  sidebarItems,
  activeHref,
  quickActions,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Grouped nav for this surface, without the shared sales-channel group. */
  sidebarGroups?: SidebarGroup[];
  /** Legacy flat nav. Prefer sidebarGroups. */
  sidebarItems?: LegacySidebarItem[];
  /** Legacy active-route marker. Requires sidebarItems. */
  activeHref?: string;
  quickActions?: React.ComponentProps<typeof AppSidebarNav>["quickActions"];
  actions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const resolvedGroups: SidebarGroup[] = sidebarGroups?.length
    ? sidebarGroups
    : sidebarItems
      ? [
          {
            items: sidebarItems.map((item, index) => ({
              key: item.href || `item-${index}`,
              label: item.label,
              href: item.href,
              badge: item.badge,
              icon: item.icon ?? DefaultNavIcon,
            })),
          },
        ]
      : [];

  const groups: SidebarGroup[] = [
    ...resolvedGroups,
    { title: "SALES CHANNELS", items: SALES_CHANNEL_LINKS },
  ];

  return (
    <div className="flex h-screen w-full bg-page overflow-hidden text-text font-sans">
      <AppSidebarNav
        groups={groups}
        quickActions={quickActions}
        // Legacy callers signal the active row with activeHref; grouped callers
        // rely on each item's href matching the pathname instead.
        selectedKey={activeHref}
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

/** Placeholder glyph for legacy items that declare no icon. */
function DefaultNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}