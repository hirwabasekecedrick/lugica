import { api } from "./client";
import type { Delivery } from "./types";

/**
 * Deliveries. Listing is role-aware (admin sees all, client sees own, driver
 * sees assigned); assign is ADMIN only.
 *
 * Note: CreateDeliveryDto requires `packageDetails` and `clientId`, but the
 * Delivery model has neither column and the service discards both
 * (create-delivery.dto.ts:11-12, deliveries.service.ts:17-30), so the values
 * are sent only to satisfy validation. See docs/API-GAPS.md #21.
 */

export const deliveries = {
  list: () => api.get<Delivery[]>("/deliveries"),

  /** Includes statusHistory with changedBy. */
  byId: (id: string) => api.get<Delivery>(`/deliveries/${id}`),

  create: (input: {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    /** Required by the DTO, discarded by the service. */
    packageDetails: string;
    /** Required by the DTO, overridden with the caller's own id. */
    clientId: string;
  }) => api.post<Delivery>("/deliveries", input),

  /**
   * ADMIN only, and only on a PENDING delivery. Atomically sets the driver and
   * vehicle, flips PENDING -> ASSIGNED, and writes a status history row.
   */
  assign: (id: string, input: { driverId: string; vehicleId: string }) =>
    api.patch<Delivery>(`/deliveries/${id}/assign`, input),
};
