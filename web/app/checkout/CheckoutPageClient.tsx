"use client";

import React, { useState } from "react";
import Link from "next/link";
import ShopNavbar from "../components/shop/ShopNavbar";
import { LoadingState, ErrorState, EmptyState } from "../components/ui-states";
import { useCart, useCheckout } from "@/lib/api/hooks";
import { formatCountdown, formatMoney, orderStatusLabel } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/lib/session-context";
import { useToast } from "@/app/components/ToastProvider";

/**
 * Checkout.
 *
 * Rewritten: the original collected customer name, email, phone, shipping
 * address and payment method. None of those exist on the Order model and
 * `POST /orders/checkout` takes no request body — it builds the order from the
 * server-side cart. There is also no payment endpoint, so the order lands in
 * PENDING_PAYMENT and the expiry job later flips it to EXPIRED.
 * See docs/API-GAPS.md #5 and #6.
 */
export default function CheckoutPageClient() {
  const cartQuery = useCart();
  const checkout = useCheckout();
  const session = useSession();
  const toast = useToast();

  const [order, setOrder] = useState<Awaited<ReturnType<typeof checkout.mutateAsync>> | null>(null);

  async function placeOrder() {
    try {
      const created = await checkout.mutateAsync();
      setOrder(created);
      toast.success(
        "Order placed",
        "Stock has been reserved for 30 minutes.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          err.message === "Cart is empty" ? "Nothing to check out" : "Could not place order",
          err.message === "Cart is empty"
            ? "Add something to your cart first."
            : err.message,
        );
        return;
      }
      toast.error("Could not place order", (err as Error).message);
    }
  }

  if (order) {
    return (
      <div className="min-h-screen bg-page text-text flex flex-col font-sans">
        <ShopNavbar onOpenCart={() => {}} onOpenWishlist={() => {}} />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="bg-page border border-border rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-xl font-black text-text">Order placed</h1>
            <p className="text-xs text-text-muted">
              Your order is reserved. Stock has been deducted from the warehouse.
            </p>

            <div className="text-left bg-surface border border-border rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Reference</span>
                <span className="font-mono text-text">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total</span>
                <span className="font-mono text-text font-bold">
                  {formatMoney(order.totalMinorUnits, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-warning font-semibold">
                  {orderStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Reservation window</span>
                <span className="font-mono text-text-accent">{formatCountdown(order.expiresAt)}</span>
              </div>
            </div>

            

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/account"
                className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-xl text-xs font-bold transition-colors"
              >
                View my orders
              </Link>
              <Link
                href="/shop"
                className="px-4 py-2 bg-surface hover:bg-sunken border border-border text-text rounded-xl text-xs font-semibold transition-colors"
              >
                Keep shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-text flex flex-col font-sans">
      <ShopNavbar onOpenCart={() => {}} onOpenWishlist={() => {}} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-xl font-black text-text">Review &amp; Checkout</h1>

        {cartQuery.isLoading ? (
          <LoadingState label="Loading your cart…" />
        ) : cartQuery.isError ? (
          <ErrorState error={cartQuery.error} onRetry={() => cartQuery.refetch()} />
        ) : (cartQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add items from the catalog before checking out."
            action={
              <Link
                href="/shop"
                className="inline-block px-4 py-2 bg-accent hover:bg-border text-on-accent text-xs font-bold rounded-lg transition-colors"
              >
                Browse the shop
              </Link>
            }
          />
        ) : (
          <>
            <section className="bg-page border border-border rounded-2xl p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">Order items</h2>
              {cartQuery.data?.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">
                      {item.product?.name ?? "Unavailable product"}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      {item.product?.sku} &times; {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-text-accent font-bold flex-shrink-0">
                    {item.product
                      ? formatMoney(item.lineTotalMinorUnits, item.product.currency)
                      : "—"}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-bold text-text">Total</span>
                <span className="text-lg font-black text-text font-mono">
                  {formatMoney(cartQuery.data?.totalMinorUnits ?? 0, cartQuery.data?.currency)}
                </span>
              </div>
            </section>

            

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/shop"
                className="px-4 py-2.5 bg-surface hover:bg-sunken border border-border text-text rounded-xl text-xs font-semibold transition-colors"
              >
                Back to shop
              </Link>
              <button
                onClick={placeOrder}
                disabled={checkout.isPending}
                className="px-6 py-2.5 bg-accent hover:bg-border text-on-accent rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {checkout.isPending ? "Placing order…" : "Place order"}
              </button>
            </div>

            {session && (
              <p className="text-[10px] text-text-muted text-right">
                Ordering as {session.email}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
