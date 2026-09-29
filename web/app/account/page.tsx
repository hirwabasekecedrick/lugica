"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import ShopNavbar from "../components/shop/ShopNavbar";
import CartDrawer from "../components/shop/CartDrawer";
import WishlistDrawer from "../components/shop/WishlistDrawer";
import ProductIcon from "../components/inventory/ProductIcon";

export default function AccountPage() {
  const { orders, lastViewedProductIds, lastPurchasedProductIds, products, currentRole } = useStore();

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Recently viewed products
  const viewedProducts = lastViewedProductIds
    .map((id: string) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[0] => Boolean(p));

  // Past purchased products
  const purchasedProducts = lastPurchasedProductIds
    .map((id: string) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[0] => Boolean(p));

  return (
    <div className="min-h-screen bg-[#0b1324] text-white flex flex-col font-sans selection:bg-[#A0D585] selection:text-[#0d1525]">
      <ShopNavbar
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Account Header */}
        <section className="bg-gradient-to-r from-[#131e36] via-[#1a2b4c] to-[#0d1525] border border-[#263B6A] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#263B6A] to-[#6984A9] border border-[#A0D585]/40 flex items-center justify-center text-lg font-black text-[#EEFABD] shadow-lg flex-shrink-0">
              MI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Maurice IRAGABA</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30 uppercase">
                  {currentRole.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-[#6984A9]">
                maurice@lugica.rw &bull; Client Hub ID #4092 &bull; Nyarutarama, Kigali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Browse Shop
            </Link>
            <Link
              href="/inventory"
              className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-xl text-xs font-bold transition-colors shadow"
            >
              Warehouse Admin &rarr;
            </Link>
          </div>
        </section>

        {/* Activity & Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Total Orders Placed
            </span>
            <p className="text-2xl font-black text-white">{orders.length}</p>
            <span className="text-xs text-[#6984A9]">Recorded in client session</span>
          </div>
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Hardware Items Owned
            </span>
            <p className="text-2xl font-black text-[#A0D585]">{lastPurchasedProductIds.length}</p>
            <span className="text-xs text-[#6984A9]">Unique SKUs purchased</span>
          </div>
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Products Inspected
            </span>
            <p className="text-2xl font-black text-[#EEFABD]">{lastViewedProductIds.length}</p>
            <span className="text-xs text-[#6984A9]">Session browsing activity</span>
          </div>
        </section>

        {/* Order History */}
        <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#263B6A] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Order History &amp; Live Tracking
              </h3>
              <p className="text-xs text-[#6984A9]">Real-time parcel delivery telemetry</p>
            </div>
            <span className="text-xs text-[#A0D585] font-semibold">{orders.length} active orders</span>
          </div>

          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-[#6984A9]">
                <p className="font-semibold text-white mb-1">No orders yet</p>
                <p className="text-xs max-w-xs mx-auto mb-4">You have not placed any orders during this session.</p>
                <Link
                  href="/shop"
                  className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors shadow"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Tracking Code</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263B6A]/50">
                  {orders.map((o) => {
                    const dateStr = new Date(o.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={o.id} className="hover:bg-[#131e36]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#EEFABD]">
                          {o.id}
                        </td>
                        <td className="py-3.5 px-4 text-[#6984A9]">{dateStr}</td>
                        <td className="py-3.5 px-4 text-white">
                          {o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#A0D585]">
                          ${o.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A0D585] animate-pulse" />
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* User Memory Sections: Last Purchased & Recently Viewed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Last Purchased Products */}
          <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Last Purchased Hardware
              </h3>
            </div>
            <p className="text-xs text-[#6984A9]">Products from your completed checkout orders.</p>

            {purchasedProducts.length === 0 ? (
              <div className="py-8 text-center bg-[#131e36]/30 border border-[#263B6A]/50 rounded-xl text-xs text-[#6984A9]">
                No completed purchases yet in this session.
              </div>
            ) : (
              <div className="space-y-2.5">
                {purchasedProducts.map((p: (typeof products)[0]) => {
                  const imageSrc = p.image?.startsWith("/") ? p.image : `/products/${p.image}.jpg`;
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0d1525] overflow-hidden flex-shrink-0">
                          <img src={imageSrc} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                          <span className="text-[10px] text-[#6984A9] font-mono">{p.sku}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#A0D585] font-mono">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Last Viewed Products */}
          <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#EEFABD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recently Viewed by You
              </h3>
            </div>
            <p className="text-xs text-[#6984A9]">Products you inspected in the storefront.</p>

            {viewedProducts.length === 0 ? (
              <div className="py-8 text-center bg-[#131e36]/30 border border-[#263B6A]/50 rounded-xl text-xs text-[#6984A9]">
                Click on any item in the shop catalog to inspect it.
              </div>
            ) : (
              <div className="space-y-2.5">
                {viewedProducts.slice(0, 4).map((p: (typeof products)[0]) => {
                  const imageSrc = p.image?.startsWith("/") ? p.image : `/products/${p.image}.jpg`;
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0d1525] overflow-hidden flex-shrink-0">
                          <img src={imageSrc} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                          <span className="text-[10px] text-[#6984A9] font-mono">{p.sku}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#EEFABD] font-mono">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenCart={() => {
          setWishlistOpen(false);
          setCartOpen(true);
        }}
      />
    </div>
  );
}
