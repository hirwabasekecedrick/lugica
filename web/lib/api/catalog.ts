import { api } from "./client";
import type { AdminProduct, Category, Paginated, Product, ProductQuery } from "./types";

/**
 * Catalog (public) and admin inventory.
 *
 * `GET /products` and `GET /admin/products` are separate implementations with
 * different visibility: the public one filters to ACTIVE only, the admin one
 * includes ARCHIVED and joins the category.
 */

export const catalog = {
  /** Public list, ACTIVE only. */
  list: (query?: ProductQuery) => api.get<Product[]>("/products", { query }),

  /** Public search over name + sku + categoryName only. */
  search: (q: string, limit?: number) =>
    api.get<Product[]>("/products/search", { query: { q, limit } }),

  /**
   * Records a recently-viewed entry when the caller is authenticated
   * (catalog.controller.ts:46-57).
   */
  byId: (id: string) => api.get<Product>(`/products/${id}`),

  /**
   * `GET /products/new-arrivals` is suspected broken — the service orders by
   * `stockMovements: { _count: 'desc' }`, which is not valid Prisma relation
   * ordering (catalog.service.ts:63-71). Omitted pending a fix.
   * See docs/API-GAPS.md #11.
   */

  /** Nested tree, not a flat list. */
  categories: () => api.get<Category[]>("/categories"),
};

export const inventory = {
  /** Includes ARCHIVED products and the category relation. Paginated. */
  list: (page?: number, limit?: number) =>
    api.get<Paginated<AdminProduct>>("/admin/products", { query: { page, limit } }),

  byId: (id: string) => api.get<AdminProduct>(`/admin/products/${id}`),

  create: (input: {
    sku: string;
    name: string;
    description: string;
    categoryId: string;
    priceMinorUnits: number;
    currency?: string;
    status?: "ACTIVE" | "ARCHIVED";
    images?: { url: string; altText?: string; sortOrder?: number }[];
  }) => api.post<AdminProduct>("/admin/products", input),

  update: (
    id: string,
    input: Partial<{
      sku: string;
      name: string;
      description: string;
      categoryId: string;
      priceMinorUnits: number;
      currency: string;
      status: "ACTIVE" | "ARCHIVED";
      images: { url: string; altText?: string; sortOrder?: number }[];
    }>,
  ) => api.patch<AdminProduct>(`/admin/products/${id}`, input),

  /** Soft delete. The API has no hard delete — see docs/API-GAPS.md #13. */
  archive: (id: string) => api.patch<AdminProduct>(`/admin/products/${id}/archive`),

  /**
   * The only way to set stock directly. `POST /admin/products` has no stock
   * field, so initial inventory must go through this.
   */
  adjustStock: (id: string, input: { quantityDelta: number; reason: string }) =>
    api.post<{ success: true }>(`/admin/products/${id}/stock-adjustment`, input),

  createCategory: (input: { name: string; parentId?: string }) =>
    api.post<Category>("/admin/categories", input),

  updateCategory: (id: string, input: { name?: string; parentId?: string | null }) =>
    api.patch<Category>(`/admin/categories/${id}`, input),
};
