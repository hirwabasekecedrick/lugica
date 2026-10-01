import { api } from "./client";
import type { DriverLiveState, LocationPingInput, MyTrackingState, TrailPoint } from "./types";

/**
 * Live tracking.
 *
 * Roles differ per endpoint, which is the whole reason this is separate from
 * `deliveries`: only ADMIN may read `GET /tracking/drivers` (it exposes every
 * driver's position), while DRIVER reads their own via `GET /tracking/me`.
 *
 * Redis is the source of truth for live positions and entries expire after
 * ~120s without a ping, so "no longer listed" and "stopped" are not the same
 * event. Callers keep the last known position and mark it stale instead of
 * dropping it — see `isStalePing` in lib/format.ts.
 */

export type LocationPingResult = { id: string; recordedAt: string };

export const tracking = {
  /** ADMIN only. Returns [] when no driver is currently tracking. */
  activeDrivers: () => api.get<DriverLiveState[]>("/tracking/drivers"),

  /** ADMIN only. Null-check the result: the API 200s with a message otherwise. */
  driverState: (driverId: string) =>
    api.get<DriverLiveState | { message: string }>(`/tracking/drivers/${driverId}`),

  /** DRIVER only. Falls back to `{ trackingStatus: "offline" }` when not started. */
  myState: () => api.get<MyTrackingState>("/tracking/me"),

  /**
   * Role-aware: admin sees any delivery, driver and client only their own.
   * Returns the full recorded trail, including points from closed deliveries.
   */
  trail: (deliveryId: string) =>
    api.get<TrailPoint[]>(`/tracking/deliveries/${deliveryId}/trail`),

  /** DRIVER only. Rate limited to 5 requests/second by the API's @Throttle. */
  ping: (input: LocationPingInput) => api.post<LocationPingResult>("/locations/ping", input),

  /**
   * Fetch the short-lived gateway token from the BFF.
   *
   * Not an API proxy path: `/api/socket-token` is a route handler in this app
   * that mints the token locally (see app/api/socket-token/route.ts), because
   * the API exposes no endpoint that issues one. Hence the direct fetch rather
   * than `api.get`, which would be indistinguishable from a proxied path.
   */
  socketToken: async (signal?: AbortSignal): Promise<string> => {
    const response = await fetch("/api/socket-token", {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? "Not authenticated"
          : `Could not obtain a socket token (${response.status})`,
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) throw new Error("Socket token response had no token");

    return data.token;
  },
};