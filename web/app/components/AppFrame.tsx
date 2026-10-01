"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LugicaLogo from "@/app/components/LugicaLogo";
import { useLogout } from "@/lib/api/hooks";
import { useSession } from "@/app/lib/session-context";
import { roleLabel } from "@/lib/format";
import { useToast } from "./ToastProvider";

/**
 * Shared sidebar for the warehouse and admin sections.
 *
 * The role switcher from the old mock UI is gone — role now comes from the
 * verified JWT, and the API enforces it independently.
 */
export function AppSidebar({
  items,
  activeHref,
}: {
  items: { href: string; label: string; badge?: number; icon?: React.ElementType }[];
  activeHref: string;
}) {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const toast = useToast();

  async function handleLogout() {
    // Replace, so the back button cannot return to an authenticated page.
    await logout.mutateAsync().catch(() => undefined);
    toast.info("Signed out", "See you next time.");
    router.replace("/login");
  }

  return (
    <aside className="hidden lg:flex w-[210px] min-w-[210px] h-screen bg-page border-r border-border flex-col overflow-hidden select-none flex-shrink-0">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <Link href="/shop">
            <LugicaLogo />
          </Link>
        </div>

        {session && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface border border-border">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-[10px] font-bold text-on-accent flex-shrink-0">
                {session.initials}
              </div>
              <div className="min-w-0">
                <span className="text-text text-xs font-semibold block truncate">
                  {session.displayName}
                </span>
                <span className="text-[10px] text-text-accent">{roleLabel(session.role)}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 pb-4 inventory-scroll">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeHref === item.href
                      ? "bg-accent text-text"
                      : "text-text-muted hover:bg-sunken hover:text-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="text-[10px] font-bold bg-warning/20 text-warning px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border px-4 py-3">
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface hover:bg-sunken text-text-muted hover:text-text text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Page frame shared by the warehouse and admin sections. */
export function AppFrame({
  title,
  subtitle,
  children,
  sidebarItems,
  activeHref,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sidebarItems: { href: string; label: string; badge?: number; icon?: React.ElementType }[];
  activeHref: string;
  actions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-page overflow-hidden text-text font-sans">
      <AppSidebar items={sidebarItems} activeHref={activeHref} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-overlay/40 backdrop-blur-sm"
          />
          <div className="fixed inset-y-0 left-0 w-[260px] bg-page border-r border-border shadow-2xl z-10">
            <div className="p-3 flex justify-end">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-text-muted cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-48px)] overflow-hidden">
              <AppSidebar items={sidebarItems} activeHref={activeHref} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 px-4 sm:px-6 border-b border-border bg-page/80 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
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
