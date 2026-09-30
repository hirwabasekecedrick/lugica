import { api } from "./client";
import type { HydratedCart, Cart, CartItem } from "./types";

/**
 * Cart (CLIENT only).
 *
 * `GET /cart` returns bare CartItem rows with no product relation, so the
 * drawer uses the BFF's hydrated route instead. Mutations go through the
 * normal endpoints, which return the bare row.
 */

export const cart = {
  /** Raw cart. Items have no product — prefer `hydrated`. */
  raw: () => api.get<Cart>("/cart"),

  /** Cart with each item's product joined in. Backs the drawer. */
  hydrated: () => api.get<HydratedCart>("/cart/hydrated"),

  add: (productId: string, quantity = 1) =>
    api.post<CartItem>("/cart/items", { productId, quantity }),

  /** Rejects quantities above stock with "Only N units available". */
  updateQuantity: (productId: string, quantity: number) =>
    api.patch<CartItem>(`/cart/items/${productId}`, { quantity }),

  remove: (productId: string) =>
    api.delete<{ success: true }>(`/cart/items/${productId}`),
};
