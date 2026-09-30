import { api } from "./client";
import type { GoodsReceipt, Supplier } from "./types";

/**
 * Procurement (ADMIN + SHOP_MANAGER).
 *
 * The receipts list omits `items` (procurement.service.ts:64-68); only the
 * by-id route includes them. Anything needing line items must fetch each
 * receipt's detail — see docs/API-GAPS.md #10.
 */

export type GoodsReceiptItemInput = {
  productId: string;
  quantityDelivered: number;
  quantityAccepted: number;
  quantityRejected: number;
  unitCostMinorUnits: number;
  batchNumber?: string;
  expiryDate?: string;
  conditionNotes?: string;
};

export const procurement = {
  suppliers: () => api.get<Supplier[]>("/suppliers"),

  createSupplier: (input: { name: string; contactName?: string; phone?: string; email?: string }) =>
    api.post<Supplier>("/suppliers", input),

  /** List WITHOUT items. */
  receipts: () => api.get<GoodsReceipt[]>("/goods-receipts"),

  /** Detail WITH items and the product on each item. */
  receipt: (id: string) => api.get<GoodsReceipt>(`/goods-receipts/${id}`),

  /**
   * The DTO refines that quantityDelivered must equal
   * quantityAccepted + quantityRejected, so enforce that in the form before
   * submitting to avoid a 400.
   */
  createReceipt: (input: {
    supplierId: string;
    deliveredByName: string;
    deliveredByPhone?: string;
    invoiceNumber?: string;
    notes?: string;
    items: GoodsReceiptItemInput[];
  }) => api.post<GoodsReceipt>("/goods-receipts", input),
};
