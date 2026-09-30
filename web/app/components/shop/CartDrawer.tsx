"use client";

/* See ShopPageClient.tsx for why next/image is not used for product photos. */
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/lib/api/hooks";
import { formatMoney, primaryImage } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import ProductIcon from "../inventory/ProductIcon";
import { useToast } from "../ToastProvider";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Cart drawer.
 *
 * Reads the BFF's hydrated cart, because `GET /cart` returns items with no
 * product relation (see docs/API-GAPS.md #7). The free-shipping meter was
 * removed: the API has no shipping or delivery-fee concept, so any threshold
 * here would be invented.
 */
export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const cartQuery = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();
  const toast = useToast();

  if (!isOpen) return null;

  const items = cartQuery.data?.items ?? [];
  const currency = cartQuery.data?.currency ?? "RWF";
  const totalMinorUnits = cartQuery.data?.totalMinorUnits ?? 0;

  function run(action: () => Promise<unknown>) {
    action().catch((err) => {
      if (err instanceof ApiError) {
        // The stock rejection is the common one, so it gets its own wording.
        toast.error(
          err.isStockConflict ? "Not enough stock" : "Cart update failed",
          err.message,
        );
        return;
      }
      toast.error("Cart update failed", (err as Error).message);
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0d1525] border-l border-[#263B6A] shadow-2xl flex flex-col z-10 animate-slideRight">
        <div className="p-4 sm:p-5 border-b border-[#263B6A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-base font-bold text-white">Your Shopping Cart</h3>
            <span className="text-xs text-[#6984A9]">({items.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 inventory-scroll">
          {cartQuery.isLoading ? (
            <div className="py-10 text-center text-xs text-[#6984A9]">Loading cart…</div>
          ) : cartQuery.isError ? (
            <div className="py-10 text-center text-xs text-rose-300">
              {cartQuery.error.message}
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6984A9]">
              <div className="w-14 h-14 rounded-2xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-sm mb-1">Your cart is empty</h4>
              <p className="text-xs max-w-xs mb-4">Browse the catalog to add hardware to your order.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#A0D585] hover:text-[#EEFABD] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => {
              const image = primaryImage(item.product);
              const max = item.product?.stockQuantity ?? item.quantity;

              return (
                <div
                  key={item.productId}
                  className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center gap-3"
                >
                  <div className="relative w-16 h-16 rounded-lg bg-[#0d1525] border border-[#263B6A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={item.product?.name ?? "Product"} className="w-full h-full object-cover" />
                    ) : (
                      <ProductIcon name={item.product?.name ?? "box"} className="w-6 h-6 text-[#A0D585]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.product?.name ?? "Unavailable product"}
                    </h4>
                    {item.product?.sku && (
                      <span className="font-mono text-[10px] text-[#6984A9] block mb-1">
                        {item.product.sku}
                      </span>
                    )}
                    <span className="text-xs font-black text-[#A0D585]">
                      {item.product
                        ? formatMoney(item.product.priceMinorUnits, item.product.currency)
                        : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => run(() => removeItem.mutateAsync(item.productId))}
                      className="text-[#6984A9] hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex items-center border border-[#263B6A] rounded-lg bg-[#0d1525] overflow-hidden">
                      <button
                        onClick={() =>
                          run(() => updateQuantity.mutateAsync({ productId: item.productId, quantity: item.quantity - 1 }))
                        }
                        className="px-2 py-0.5 text-xs text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-white font-mono min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          run(() => updateQuantity.mutateAsync({ productId: item.productId, quantity: item.quantity + 1 }))
                        }
                        disabled={item.quantity >= max}
                        className="px-2 py-0.5 text-xs text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#263B6A] bg-[#0d1525] space-y-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-white">Order total</span>
              <span className="text-[#EEFABD] text-base font-black font-mono">
                {formatMoney(totalMinorUnits, currency)}
              </span>
            </div>
            <p className="text-[10px] text-[#6984A9]">
              Delivery is arranged separately and is not included in this total.
            </p>

            <Link
              href="/checkout"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs transition-colors cursor-pointer shadow-lg"
            >
              <span>Checkout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
