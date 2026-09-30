import { api } from "./client";
import type { Vehicle, Role, User, Paginated } from "./types";

/** Vehicles — every route is ADMIN only. */

export const vehicles = {
  list: () => api.get<Vehicle[]>("/vehicles"),

  byId: (id: string) => api.get<Vehicle>(`/vehicles/${id}`),

  /**
   * The service enforces ownershipType/ownedByDriverId consistency:
   * INDIVIDUAL requires an owner, COMPANY rejects one.
   */
  create: (input: {
    plateNumber: string;
    type: string;
    capacity: number;
    ownershipType: "COMPANY" | "INDIVIDUAL";
    ownedByDriverId?: string;
  }) => api.post<Vehicle>("/vehicles", input),

  /** Closes the prior assignment and opens a new VehicleAssignment row. */
  assignDriver: (id: string, input: { driverId: string }) =>
    api.patch<Vehicle>(`/vehicles/${id}/assign-driver`, input),
};

/** Users. Listing and creating are ADMIN only; update is self-or-admin. */

export const users = {
  list: (page?: number, limit?: number, role?: Role) =>
    api.get<Paginated<User>>("/users", { query: { page, limit, role } }),

  create: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: Role;
    licenseNumber?: string;
  }) => api.post<User>("/users", input),

  /**
   * Non-admins may update only their own profile and cannot change isActive
   * (users.controller.ts:86-91).
   */
  update: (
    id: string,
    input: Partial<{
      name: string;
      phone: string;
      isActive: boolean;
      licenseNumber: string;
      isAvailable: boolean;
    }>,
  ) => api.patch<User>(`/users/${id}`, input),
};

/**
 * Driver location ping — DRIVER only, throttled to 5 req/s. Intended for the
 * mobile client; not surfaced in the web app. See docs/API-GAPS.md #20.
 */
export const locations = {
  ping: (input: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    deliveryId?: string;
  }) => api.post<{ success: true }>("/locations/ping", input),
};
