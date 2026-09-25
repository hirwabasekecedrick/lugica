"use client";

import React, { useState } from "react";
import Link from "next/link";
import LugicaLogo from "../LugicaLogo";
import { useStore } from "../../lib/store";

interface ShopNavbarProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export default function ShopNavbar({ onOpenCart, onOpenWishlist }: ShopNavbarProps) {
  const { cart, wishlist, currentRole, switchRole } = useStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1525]/90 backdrop-blur-md border-b border-[#263B6A]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link href="/shop" className="flex items-center gap-2">
            <LugicaLogo />
            <span className="hidden sm:inline-block text-[11px] font-bold text-[#A0D585] tracking-wider px-2 py-0.5 rounded bg-[#A0D585]/15 border border-[#A0D585]/30">
              STOREFRONT
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/shop"
              className="text-[#EEFABD] hover:text-white transition-colors"
            >
              Shop Catalog
            </Link>
            <Link
              href="/account"
              className="text-[#6984A9] hover:text-[#EEFABD] transition-colors"
            >
              My Orders &amp; Activity
            </Link>
            <Link
              href="/inventory"
              className="text-[#6984A9] hover:text-[#EEFABD] transition-colors flex items-center gap-1"
            >
              <span>Admin Portal</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Role pill & switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131e36] border border-[#263B6A] hover:border-[#6984A9] text-xs transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#A0D585]" />
              <span className="text-[#6984A9] hidden sm:inline">Role:</span>
              <span className="font-semibold text-white capitalize">{currentRole.replace("_", " ")}</span>
              <svg className="w-3 h-3 text-[#6984A9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-[#131e36] border border-[#263B6A] rounded-xl p-1.5 shadow-2xl z-50 animate-fadeIn min-w-[150px] text-xs">
                <p className="text-[10px] font-semibold text-[#6984A9] uppercase px-2 py-1">
                  Active Persona
                </p>
                {(["client", "shop_manager", "admin"] as const).map((r) => (
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

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-lg bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] hover:text-[#EEFABD] transition-colors cursor-pointer"
            title="Wishlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
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
