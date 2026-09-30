"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LugicaLogo from "../LugicaLogo";
import { useCart, useLogout, useWishlist } from "@/lib/api/hooks";
import { useSession } from "@/app/lib/session-context";
import { roleLabel } from "@/lib/format";
import { hasRole, WAREHOUSE_ROLES } from "@/lib/roles";
import { useToast } from "../ToastProvider";

interface ShopNavbarProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export default function ShopNavbar({ onOpenCart, onOpenWishlist }: ShopNavbarProps) {
  const session = useSession();
  const cartQuery = useCart();
  const wishlistQuery = useWishlist();
  const logout = useLogout();
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartItemCount = cartQuery.data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const wishlistCount = wishlistQuery.data?.length ?? 0;
  const canUseWarehouse = hasRole(session, WAREHOUSE_ROLES);

  async function handleLogout() {
    // Replace, so the back button cannot return to an authenticated page.
    await logout.mutateAsync().catch(() => undefined);
    toast.info("Signed out", "See you next time.");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1525]/90 backdrop-blur-md border-b border-[#263B6A]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/shop" className="flex items-center gap-2">
            <LugicaLogo />
            <span className="hidden sm:inline-block text-[11px] font-bold text-[#A0D585] tracking-wider px-2 py-0.5 rounded bg-[#A0D585]/15 border border-[#A0D585]/30">
              STOREFRONT
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <Link href="/shop" className="text-[#EEFABD] hover:text-white transition-colors">
              Shop Catalog
            </Link>
            <Link href="/account" className="text-[#6984A9] hover:text-[#EEFABD] transition-colors">
              My Orders &amp; Activity
            </Link>
            {canUseWarehouse && (
              <>
                <Link
                  href="/inventory"
                  className="text-[#6984A9] hover:text-[#EEFABD] transition-colors"
                >
                  Warehouse
                </Link>
                <Link
                  href="/admin/users"
                  className="text-[#6984A9] hover:text-[#EEFABD] transition-colors"
                >
                  Admin
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Role is read from the JWT; it is no longer switchable. */}
          {session && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131e36] border border-[#263B6A] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#A0D585]" />
              <span className="text-[#6984A9]">Role:</span>
              <span className="font-semibold text-white">{roleLabel(session.role)}</span>
            </div>
          )}

          {session && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131e36] border border-[#263B6A] hover:border-[#6984A9] text-xs transition-colors cursor-pointer"
                title="Account menu"
              >
                <span className="w-5 h-5 rounded bg-[#263B6A] text-[#A0D585] text-[10px] font-bold flex items-center justify-center">
                  {session.initials}
                </span>
                <span className="text-white max-w-[110px] truncate hidden md:inline">
                  {session.displayName}
                </span>
                <svg className="w-3 h-3 text-[#6984A9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#131e36] border border-[#263B6A] rounded-xl p-1.5 shadow-2xl z-50 animate-fadeIn min-w-[190px] text-xs">
                  <div className="px-2 py-1.5 border-b border-[#263B6A] mb-1">
                    <p className="text-white font-semibold truncate">{session.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-[#6984A9] hover:bg-[#263B6A]/40 hover:text-white block"
                  >
                    My account
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-300 hover:bg-[#263B6A]/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {logout.isPending ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-lg bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer"
            title="Wishlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 000-6.364l-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            <span className="w-4 h-4 rounded-full bg-[#0d1525] text-[#A0D585] text-[10px] font-black flex items-center justify-center">
              {cartItemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
