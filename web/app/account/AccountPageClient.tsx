"use client";

import React, { useState } from "react";
import Link from "next/link";
import ShopNavbar from "../components/shop/ShopNavbar";
import CartDrawer from "../components/shop/CartDrawer";
import WishlistDrawer from "../components/shop/WishlistDrawer";
import ProductIcon from "../components/inventory/ProductIcon";
import { LoadingState, ErrorState, EmptyState } from "../components/ui-states";
import {
  useAddToCart,
  useLastPurchased,
  useOrders,
  useRecentlyViewed,
  useWishlist,
} from "@/lib/api/hooks";
import {
  formatCountdown,
  formatDateTime,
  formatMoney,
  orderStatusLabel,
  roleLabel,
} from "@/lib/format";
import { useSession } from "@/app/lib/session-context";
import { useToast } from "@/app/components/ToastProvider";
import { hasRole, WAREHOUSE_ROLES } from "@/lib/roles";
import type { OrderStatus } from "@/lib/api/types";

/**
 * Account hub.
 *
 * Identity comes from the verified JWT, so the name shown is the email
 * local-part — the API exposes no way to fetch the real name (see
 * docs/API-GAPS.md #1). The old "Client Hub ID #4092" had no backing field and
 * is gone. The "Live Tracking" section was removed: order rows carry no
 * tracking data, only status.
 */
export default function AccountPageClient() {
  const session = useSession();
  const ordersQuery = useOrders();
  const viewedQuery = useRecentlyViewed();
  const purchasedQuery = useLastPurchased();
  const wishlistQuery = useWishlist();
  const addToCart = useAddToCart();
  const toast = useToast();

  function handleAddToCart(input: { productId: string; quantity?: number }, name: string) {
    addToCart.mutate(input, {
      onSuccess: () => toast.success("Added to cart", name),
      onError: (err) => toast.error("Could not add to cart", (err as Error).message),
    });
  }

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);

  const orders = ordersQuery.data?.data ?? [];
  const totalOrders = ordersQuery.data?.meta.total ?? 0;
  const viewed = viewedQuery.data ?? [];
  const purchased = purchasedQuery.data ?? [];

  const canUseWarehouse = hasRole(session, WAREHOUSE_ROLES);

  return (
    <div className="min-h-screen bg-[#0b1324] text-white flex flex-col font-sans selection:bg-[#A0D585] selection:text-[#0d1525]">
      <ShopNavbar onOpenCart={() => setCartOpen(true)} onOpenWishlist={() => setWishlistOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="bg-gradient-to-r from-[#131e36] via-[#1a2b4c] to-[#0d1525] border border-[#263B6A] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#263B6A] to-[#6984A9] border border-[#A0D585]/40 flex items-center justify-center text-lg font-black text-[#EEFABD] shadow-lg flex-shrink-0">
              {session?.initials ?? "—"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                  {session?.displayName ?? "Signed in"}
                </h1>
                {session && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30 uppercase">
                    {roleLabel(session.role)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6984A9]">{session?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Browse Shop
            </Link>
            {canUseWarehouse && (
              <Link
                href="/inventory"
                className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-xl text-xs font-bold transition-colors"
              >
                Warehouse Admin &rarr;
              </Link>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Total Orders
            </span>
            <p className="text-2xl font-black text-white">{totalOrders}</p>
          </div>
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Saved Items
            </span>
            <p className="text-2xl font-black text-[#A0D585]">{wishlistQuery.data?.length ?? 0}</p>
          </div>
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
            <span className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider block mb-1">
              Recently Viewed
            </span>
            <p className="text-2xl font-black text-[#EEFABD]">{viewed.length}</p>
            <span className="text-xs text-[#6984A9]">Clears after 7 days</span>
          </div>
        </section>

        <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#263B6A] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order History</h3>
              <p className="text-xs text-[#6984A9]">
                Orders are held for payment and expire if not settled in time.
              </p>
            </div>
            <select
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter((e.target.value || undefined) as OrderStatus | undefined)}
              className="bg-[#131e36] border border-[#263B6A] text-[#EEFABD] text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-[#A0D585] cursor-pointer"
            >
              <option value="">All statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAID">Paid</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {ordersQuery.isLoading ? (
            <LoadingState label="Loading orders…" />
          ) : ordersQuery.isError ? (
            <div className="p-5">
              <ErrorState error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet"
                description="You have not placed any orders."
                action={
                  <Link
                    href="/shop"
                    className="inline-block px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] text-xs font-bold rounded-lg transition-colors"
                  >
                    Shop now
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Placed</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263B6A]/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#131e36]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#EEFABD] break-all">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-4 text-[#6984A9] whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        {(order.items ?? [])
                          .map((i) => `${i.productNameSnapshot} (x${i.quantity})`)
                          .join(", ")}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#A0D585] whitespace-nowrap">
                        {formatMoney(order.totalMinorUnits, order.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            order.status === "EXPIRED" || order.status === "CANCELLED"
                              ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
                              : order.status === "PENDING_PAYMENT"
                                ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                                : "bg-[#A0D585]/15 text-[#A0D585] border-[#A0D585]/30"
                          }`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                        {order.status === "PENDING_PAYMENT" && (
                          <span className="block text-[10px] text-[#6984A9] mt-1">
                            {formatCountdown(order.expiresAt)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductStrip
            title="Last Purchased"
            products={purchased}
            emptyText="No paid orders yet. Purchases appear once an order reaches Paid or Fulfilled."
            onAdd={(input, name) => handleAddToCart(input, name)}
          />
          <ProductStrip
            title="Recently Viewed"
            products={viewed}
            emptyText="Open any product in the storefront to build this list."
            onAdd={(input, name) => handleAddToCart(input, name)}
          />
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

function ProductStrip({
  title,
  products,
  emptyText,
  onAdd,
}: {
  title: string;
  products: { id: string; name: string; sku: string; priceMinorUnits: number; currency: string; stockQuantity: number }[];
  emptyText: string;
  onAdd: (input: { productId: string; quantity?: number }, name: string) => void;
}) {
  return (
    <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-5 shadow-xl space-y-3">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>

      {products.length === 0 ? (
        <div className="py-8 text-center bg-[#131e36]/30 border border-[#263B6A]/50 rounded-xl text-xs text-[#6984A9]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#0d1525] flex items-center justify-center flex-shrink-0">
                  <ProductIcon name={p.name} className="w-5 h-5 text-[#6984A9]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-tight truncate">{p.name}</p>
                  <span className="text-[10px] text-[#6984A9] font-mono">{p.sku}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-[#A0D585] font-mono block">
                  {formatMoney(p.priceMinorUnits, p.currency)}
                </span>
                {p.stockQuantity > 0 && (
                  <button
                    onClick={() => onAdd({ productId: p.id, quantity: 1 }, p.name)}
                    className="text-[10px] text-[#EEFABD] hover:text-[#A0D585] font-semibold mt-0.5 cursor-pointer"
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
