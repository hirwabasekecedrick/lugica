"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { catalog, inventory } from "./catalog";
import { cart } from "./cart";
import { wishlist } from "./wishlist";
import { orders, activity } from "./orders";
import { procurement } from "./procurement";
import { deliveries } from "./deliveries";
import { vehicles, users, locations } from "./admin";
import { auth } from "./auth";
import type {
  AdminProduct,
  Category,
  Delivery,
  GoodsReceipt,
  HydratedCart,
  OrderStatus,
  Product,
  ProductQuery,
  Role,
  Supplier,
  Vehicle,
  WishlistItem,
} from "./types";

/* ── Query keys ───────────────────────────────────────────────────────────── */

/** Body shape for PATCH /admin/products/:id. */
export type ProductUpdateInput = Parameters<typeof inventory.update>[1];

/** Body shape for PATCH /users/:id. */
export type UserUpdateInput = Parameters<typeof users.update>[1];

export const qk = {
  products: (query?: ProductQuery) => ["products", query ?? {}] as const,
  categories: () => ["categories"] as const,
  adminProducts: (page?: number) => ["admin-products", page ?? 1] as const,
  adminProduct: (id: string) => ["admin-product", id] as const,
  cart: () => ["cart"] as const,
  wishlist: () => ["wishlist"] as const,
  orders: (page?: number, status?: OrderStatus) => ["orders", page ?? 1, status ?? null] as const,
  allOrders: (page?: number, status?: OrderStatus) =>
    ["all-orders", page ?? 1, status ?? null] as const,
  recentlyViewed: () => ["activity-recently-viewed"] as const,
  lastPurchased: () => ["activity-last-purchased"] as const,
  suppliers: () => ["suppliers"] as const,
  receipts: () => ["receipts"] as const,
  receipt: (id: string) => ["receipt", id] as const,
  deliveries: () => ["deliveries"] as const,
  delivery: (id: string) => ["delivery", id] as const,
  vehicles: () => ["vehicles"] as const,
  users: (page?: number, role?: Role) => ["users", page ?? 1, role ?? null] as const,
} as const;

/* ── Catalog (public) ─────────────────────────────────────────────────────── */

export function useProducts(query?: ProductQuery) {
  return useQuery({
    queryKey: qk.products(query),
    queryFn: () => catalog.list(query),
  });
}

export function useProductSearch(q: string) {
  return useQuery({
    queryKey: ["product-search", q],
    queryFn: () => catalog.search(q),
    // The API matches on searchText (name + sku + categoryName) only.
    enabled: q.trim().length > 0,
  });
}

export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({ queryKey: qk.categories(), queryFn: catalog.categories });
}

/* ── Cart & wishlist ──────────────────────────────────────────────────────── */

export function useCart(): UseQueryResult<HydratedCart> {
  return useQuery({ queryKey: qk.cart(), queryFn: cart.hydrated });
}

export function useWishlist(): UseQueryResult<WishlistItem[]> {
  return useQuery({ queryKey: qk.wishlist(), queryFn: wishlist.list });
}

/* ── Orders & activity ────────────────────────────────────────────────────── */

export function useOrders(page?: number, status?: OrderStatus) {
  return useQuery({
    queryKey: qk.orders(page, status),
    queryFn: () => orders.mine(page, undefined, status),
    // Orders expire server-side on a timer; poll so the status stays honest.
    refetchInterval: 60_000,
  });
}

export function useAllOrders(page?: number, status?: OrderStatus) {
  return useQuery({
    queryKey: qk.allOrders(page, status),
    queryFn: () => orders.all(page, undefined, status),
  });
}

export function useRecentlyViewed() {
  return useQuery({ queryKey: qk.recentlyViewed(), queryFn: activity.recentlyViewed });
}

export function useLastPurchased() {
  return useQuery({ queryKey: qk.lastPurchased(), queryFn: activity.lastPurchased });
}

/* ── Warehouse ────────────────────────────────────────────────────────────── */

export function useAdminProducts(page?: number) {
  return useQuery<AdminProduct[]>({
    queryKey: qk.adminProducts(page),
    queryFn: () => inventory.list(page, 100),
  });
}

export function useSuppliers(): UseQueryResult<Supplier[]> {
  return useQuery({ queryKey: qk.suppliers(), queryFn: procurement.suppliers });
}

export function useGoodsReceipts(): UseQueryResult<GoodsReceipt[]> {
  return useQuery({ queryKey: qk.receipts(), queryFn: procurement.receipts });
}

/* ── Admin ────────────────────────────────────────────────────────────────── */

export function useDeliveries(): UseQueryResult<Delivery[]> {
  return useQuery({ queryKey: qk.deliveries(), queryFn: deliveries.list });
}

export function useDelivery(id: string | null) {
  return useQuery({
    queryKey: qk.delivery(id ?? ""),
    queryFn: () => deliveries.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useVehicles(): UseQueryResult<Vehicle[]> {
  return useQuery({ queryKey: qk.vehicles(), queryFn: vehicles.list });
}

export function useUsers(page?: number, role?: Role) {
  return useQuery({
    queryKey: qk.users(page, role),
    queryFn: () => users.list(page, 25, role),
  });
}

/* ── Mutations ────────────────────────────────────────────────────────────── */

/**
 * Invalidate everything whose value a cart or stock change affects.
 * Checkout clears the cart server-side and decrements stock, so products and
 * orders must all be refetched together.
 */
function useStockInvalidation() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.cart() });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
  };
}

export function useAddToCart() {
  const invalidate = useStockInvalidation();

  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      cart.add(productId, quantity),
    onSuccess: invalidate,
  });
}

export function useUpdateCartQuantity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cart.updateQuantity(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart() }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => cart.remove(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart() }),
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();

  return useMutation<
    // add returns the saved row, remove returns { success: true }.
    WishlistItem | { success: true },
    Error,
    { productId: string; saved: boolean }
  >({
    mutationFn: ({ productId, saved }: { productId: string; saved: boolean }) =>
      saved ? wishlist.remove(productId) : wishlist.add(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.wishlist() }),
  });
}

export function useCheckout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => orders.checkout(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.cart() });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventory.archive(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: inventory.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdateInput }) =>
      inventory.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; quantityDelta: number; reason: string }) =>
      inventory.adjustStock(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: inventory.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories() }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: procurement.createSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.suppliers() }),
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: procurement.createReceipt,
    onSuccess: () => {
      // Receiving stock changes quantities, not just the receipt log.
      void qc.invalidateQueries({ queryKey: qk.receipts() });
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: users.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
      users.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: vehicles.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.vehicles() }),
  });
}

export function useAssignVehicleDriver() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, driverId }: { id: string; driverId: string }) =>
      vehicles.assignDriver(id, { driverId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.vehicles() }),
  });
}

export function useAssignDelivery() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, driverId, vehicleId }: { id: string; driverId: string; vehicleId: string }) =>
      deliveries.assign(id, { driverId, vehicleId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deliveries() });
      void qc.invalidateQueries({ queryKey: ["delivery"] });
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: auth.login,
    onSuccess: () => qc.clear(),
  });
}

export function useRegister() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: auth.register,
    onSuccess: () => qc.clear(),
  });
}

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: auth.logout,
    // Clear locally regardless: a failed revoke must not strand the session.
    onSettled: () => qc.clear(),
  });
}

export { locations };
export type { Product };
