import { api } from "./client";
import type { WishlistItem } from "./types";

/**
 * Wishlist (CLIENT only).
 *
 * `addItem` returns the existing row when the product is already saved rather
 * than erroring (wishlist.service.ts:27), so the caller must reconcile state
 * itself. The included product has no images — see docs/API-GAPS.md #8.
 */

export const wishlist = {
  list: () => api.get<WishlistItem[]>("/wishlist"),

  add: (productId: string) => api.post<WishlistItem>("/wishlist/items", { productId }),

  remove: (productId: string) =>
    api.delete<{ success: true }>(`/wishlist/items/${productId}`),
};
