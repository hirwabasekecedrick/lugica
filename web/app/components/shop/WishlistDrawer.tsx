"use client";

import React from "react";
import {
  useAddToCart,
  useToggleWishlist,
  useWishlist,
} from "@/lib/api/hooks";
import { formatMoney } from "@/lib/format";
import ProductIcon from "../inventory/ProductIcon";
import { useToast } from "../ToastProvider";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

/**
 * Wishlist drawer.
 *
 * `GET /wishlist` includes the product but not its images (see
 * docs/API-GAPS.md #8), and the seed creates no images anyway, so every tile
 * falls back to the icon. "Move to cart" adds to the cart and removes from
 * the wishlist, since both are server-side mutations.
 */
export default function WishlistDrawer({ isOpen, onClose, onOpenCart }: WishlistDrawerProps) {
  const wishlistQuery = useWishlist();
  const addToCart = useAddToCart();
  const toggle = useToggleWishlist();
  const toast = useToast();

  if (!isOpen) return null;

  const items = wishlistQuery.data ?? [];

  async function moveToCart(productId: string) {
    try {
      await addToCart.mutateAsync({ productId, quantity: 1 });
      await toggle.mutateAsync({ productId, saved: true });
      toast.success("Moved to cart");
      onOpenCart();
    } catch (err) {
      toast.error("Could not move item", (err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0d1525] border-l border-[#263B6A] shadow-2xl flex flex-col z-10 animate-slideRight">
        <div className="p-4 sm:p-5 border-b border-[#263B6A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <h3 className="text-base font-bold text-white">Saved Wishlist</h3>
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
          {wishlistQuery.isLoading ? (
            <div className="py-10 text-center text-xs text-[#6984A9]">Loading wishlist…</div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6984A9]">
              <div className="w-14 h-14 rounded-2xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 000-6.364l-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-sm mb-1">Your wishlist is empty</h4>
              <p className="text-xs max-w-xs mb-4">
                Tap the heart on any item in the catalog to save it for later.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#A0D585] hover:text-[#EEFABD] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Explore Products
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = item.product;
              const outOfStock = !product || product.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-lg bg-[#0d1525] border border-[#263B6A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <ProductIcon name={product?.name ?? "box"} className="w-6 h-6 text-[#A0D585]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {product?.name ?? "Unavailable product"}
                    </h4>
                    {product && (
                      <>
                        <span className="font-mono text-[10px] text-[#6984A9] block mb-1">
                          {product.sku}
                        </span>
                        <span className="text-xs font-black text-[#A0D585]">
                          {formatMoney(product.priceMinorUnits, product.currency)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        toggle.mutate(
                          { productId: item.productId, saved: true },
                          {
                            onSuccess: () => toast.success("Removed from wishlist"),
                            onError: (err) =>
                              toast.error("Could not update wishlist", (err as Error).message),
                          },
                        )
                      }
                      className="text-[#6984A9] hover:text-rose-400 text-xs transition-colors p-1 cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <button
                      onClick={() => moveToCart(item.productId)}
                      disabled={outOfStock}
                      className="px-2.5 py-1 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-md text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {outOfStock ? "Out of Stock" : "Move to Cart"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
