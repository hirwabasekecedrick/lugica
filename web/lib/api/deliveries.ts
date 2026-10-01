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

<<<<<<< HEAD
/* ── Status transitions ─────────────────────────────────────────────────────
=======
  /* ── Status transitions ─────────────────────────────────────────────────────
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
   *
   * The state machine is fixed (deliveries.service.ts:190-222):
   *   PENDING    -> ASSIGNED  (admin assign only)
   *   ASSIGNED   -> PICKED_UP    <- the driver's "accept"
   *   PICKED_UP  -> IN_TRANSIT
   *   IN_TRANSIT -> DELIVERED | FAILED
   * CANCELLED is reachable from PENDING/ASSIGNED/PICKED_UP.
   *
   * Only the assigned driver or an admin may run these; a third driver gets a
   * 403. Each takes an optional `notes` (max 500 chars) and writes a
   * DeliveryStatusHistory row, and each broadcasts on the tracking gateway.
<<<<<<< HEAD
   *
   * Note `notes ? { notes } : {}` rather than `{ notes }`: sending
   * `{ notes: undefined }` serialises to `{}` anyway, but an explicit empty
   * body keeps the request honest when there is nothing to record.
=======
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
   */

  /** ASSIGNED -> PICKED_UP. The driver's accept action. */
  pickup: (id: string, notes?: string) =>
    api.patch<Delivery>(`/deliveries/${id}/pickup`, notes ? { notes } : {}),

  /** PICKED_UP -> IN_TRANSIT. Start driving to the dropoff. */
  transit: (id: string, notes?: string) =>
    api.patch<Delivery>(`/deliveries/${id}/transit`, notes ? { notes } : {}),

  /** IN_TRANSIT -> DELIVERED. Sets deliveredAt. */
  deliver: (id: string, notes?: string) =>
    api.patch<Delivery>(`/deliveries/${id}/deliver`, notes ? { notes } : {}),

  /** IN_TRANSIT -> FAILED. Terminal. */
  fail: (id: string, notes?: string) =>
    api.patch<Delivery>(`/deliveries/${id}/fail`, notes ? { notes } : {}),
};
