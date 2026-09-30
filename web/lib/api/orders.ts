import { api } from "./client";
import type { Order, OrderStatus, Paginated, Product } from "./types";

/**
 * Orders.
 *
 * `POST /orders/checkout` takes NO request body — it builds the order entirely
 * from the server-side cart, and the Order model has no shipping address or
 * payment method. There is also no payment endpoint, so orders sit in
 * PENDING_PAYMENT until the expiry job flips them to EXPIRED.
 * See docs/API-GAPS.md #5 and #6.
 */

export const orders = {
  checkout: () => api.post<Order>("/orders/checkout"),

  /** Own orders, CLIENT only. Paginated. */
  mine: (page?: number, limit?: number, status?: OrderStatus) =>
    api.get<Paginated<Order>>("/orders", { query: { page, limit, status } }),

  /** All orders, ADMIN + SHOP_MANAGER. Paginated. Read-only — no status route. */
  all: (page?: number, limit?: number, status?: OrderStatus) =>
    api.get<Paginated<Order>>("/admin/orders", { query: { page, limit, status } }),
};

/**
 * Recently viewed / last purchased (CLIENT only).
 *
 * Backed by Redis with a 7-day TTL, so these can legitimately be empty after
 * a week even for a user with history.
 */
export const activity = {
  recentlyViewed: () => api.get<Product[]>("/activity/recently-viewed"),

  lastPurchased: () => api.get<Product[]>("/activity/last-purchased"),
};
