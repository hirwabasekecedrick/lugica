"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LugicaLogo from "./LugicaLogo";
import { useLogout } from "@/lib/api/hooks";
import { useSession } from "@/app/lib/session-context";
import { roleLabel } from "@/lib/format";
import { useToast } from "./ToastProvider";
import {
  AccountIcon,
  CheckoutIcon,
  CloseIcon,
  CreateIcon,
  ChevronDownIcon,
  StorefrontIcon,
} from "./sidebar-icons";

/**
 * The single application sidebar, shared by every staff surface
 * (/inventory, /admin/*, /driver).
 *
 * It exists because three shells previously rendered three different
 * sidebars: the warehouse one was hand-built, while the admin and driver
 * frames used the plainer AppSidebar in AppFrame.tsx. Navigation, badges and
 * the identity block then differed between pages an operator moves between in
 * one click. Both shells now build their nav groups and hand them here, so
 * spacing, icon treatment, active state and the footer are identical by
 * construction.
 *
 * The role switcher from the original mock UI is deliberately gone: role now
 * comes from the verified JWT, so a switcher would be a privilege-escalation
 * control. Badges are real counts from the API.
 */

export interface SidebarItem {
  /** Stable identity for React keys and active-state matching. */
  key: string;
  label: string;
  icon: React.ElementType;
  /** Renders as a <Link>. Omit for in-page tab state. */
  href?: string;
  /** Renders as a <button> that calls this. Used with href omitted. */
  onSelect?: () => void;
  /** Count pill on the trailing edge. Hidden when 0 or undefined. */
  badge?: number;
  /** "warning" for attention counts, "accent" for neutral counts. */
  badgeTone?: "warning" | "accent";
  /** Trailing chip shown instead of a numeric badge, e.g. "VIEW". */
  trailingChip?: string;
}

export interface SidebarGroup {
  /** Small uppercase heading. Omit for an unlabelled group. */
  title?: string;
  items: SidebarItem[];
}

/** Entry in the "New Action" dropdown above the nav. */
export interface QuickAction {
  key: string;
  label: string;
  icon: React.ElementType;
  onSelect: () => void;
}

const navItemClass = (active: boolean) =>
  `flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
    active ? "bg-accent text-text" : "text-text-muted hover:bg-sunken hover:text-text"
  }`;

/**
 * The sales-channel links, identical on every staff surface.
 *
 * Exported because /shop is the storefront and these destinations are the same
 * for warehouse staff, admins and drivers.
 */
export const SALES_CHANNEL_LINKS: SidebarItem[] = [
  { key: "store", label: "Client Store", href: "/shop", icon: StorefrontIcon, trailingChip: "VIEW" },
  { key: "checkout", label: "Checkout Flow", href: "/checkout", icon: CheckoutIcon },
  { key: "account", label: "My Account", href: "/account", icon: AccountIcon },
];

export default function AppSidebarNav({
  groups,
  quickActions,
  selectedKey,
  mobileOpen = false,
  onCloseMobile,
}: {
  groups: SidebarGroup[];
  /** Renders the accent "New Action" button. Omit to drop it. */
  quickActions?: QuickAction[];
  /**
   * Key of the item to highlight. Needed for tabs, which have no href to
   * compare against the pathname.
   */
  selectedKey?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [quickOpen, setQuickOpen] = useState(false);

  async function handleSignOut() {
    // Replace, so the back button cannot return to an authenticated page.
    await logout.mutateAsync().catch(() => undefined);
    toast.info("Signed out", "See you next time.");
    router.replace("/login");
  }

  /**
   * An item is active when it is the selected tab, or when it is a link to the
   * current route. Both are checked because the warehouse mixes tabs (no URL)
   * with links, and a driver tab can be nested under the /driver prefix.
   */
  function isActive(item: SidebarItem) {
    if (selectedKey && item.key === selectedKey) return true;
    if (!item.href) return false;
    return pathname === item.href;
  }

  function runItem(item: SidebarItem) {
    item.onSelect?.();
    onCloseMobile?.();
  }

  const body = (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Logo + identity header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link href="/shop" aria-label="Lugica home">
            <LugicaLogo />
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sunken transition-colors cursor-pointer"
              title="Close menu"
              aria-label="Close menu"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Identity + role indicator. Read-only: role now comes from the JWT. */}
        {session && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-[11px] font-bold text-on-accent flex-shrink-0">
              {session.initials.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-text text-xs font-semibold block leading-tight truncate">
                {session.displayName}
              </span>
              <span className="text-[10px] text-text-accent font-mono capitalize block truncate">
                {roleLabel(session.role)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="px-4 py-3 relative">
          <button
            onClick={() => setQuickOpen(!quickOpen)}
            aria-expanded={quickOpen}
            className="w-full flex items-center justify-between px-3 py-2 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <CreateIcon className="w-4 h-4" />
              <span>New Action</span>
            </span>
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {quickOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-surface border border-border rounded-xl p-1 shadow-2xl z-50 animate-fadeIn">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => {
                    setQuickOpen(false);
                    action.onSelect();
                    onCloseMobile?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-sunken rounded-lg text-xs font-semibold text-text flex items-center gap-2 cursor-pointer"
                >
                  <action.icon className="w-4 h-4 text-text-accent" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 inventory-scroll">
        {groups.map((group, groupIndex) => (
          <div key={group.title ?? `group-${groupIndex}`}>
            {group.title && (
              <p className="text-text-muted/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const showBadge = typeof item.badge === "number" && item.badge > 0;
                const inner = (
                  <>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.trailingChip ? (
                      <span className="text-[9px] font-bold bg-accent/20 text-text-accent border border-accent/30 px-1.5 py-0.5 rounded flex-shrink-0">
                        {item.trailingChip}
                      </span>
                    ) : showBadge ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                          item.badgeTone === "accent"
                            ? "bg-accent/20 text-text-accent"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                );

                return (
                  <li key={item.key}>
                    {item.href ? (
                      <Link href={item.href} onClick={onCloseMobile} className={navItemClass(active)}>
                        {inner}
                      </Link>
                    ) : (
                      <button onClick={() => runItem(item)} className={`w-full text-left cursor-pointer ${navItemClass(active)}`}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: hub status + identity + sign out */}
      <div className="px-4 py-2 bg-surface/60 border-t border-border/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Hub Status:</span>
          <span className="text-text-accent font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Operational
          </span>
        </div>
      </div>

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
          className="text-text-muted hover:text-text transition-colors p-1 cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-3 3H6a2 2 0 01-3-3V7a2 2 0 013-3h4a2 2 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[210px] min-w-[210px] h-screen bg-page border-r border-border flex-col overflow-hidden select-none flex-shrink-0">
        {body}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-overlay/40 backdrop-blur-sm transition-opacity animate-fadeIn"
          />
          <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-page border-r border-border shadow-2xl flex flex-col z-10 animate-slideRight">
            {body}
          </div>
        </div>
      )}
    </>
  );
}