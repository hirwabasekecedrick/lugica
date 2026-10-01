import { api } from "./client";
import type {
  DeliverySummary,
  DriverLiveState,
  LocationPingInput,
  MyTrackingState,
  TrailPoint,
} from "./types";

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
   *
   * Returns the recorded trail in chronological order, including points from
   * closed deliveries.
   *
   * At the 3s transmission interval one trip passes 1000 points quickly, so
   * `maxPoints` uniformly samples the trail down (default 500). Sampling is a
   * stride across the whole range, not a truncation, so the path keeps its shape.
   */
  trail: (deliveryId: string, options: { maxPoints?: number; since?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.maxPoints !== undefined) {
      params.set("maxPoints", String(options.maxPoints));
    }
    if (options.since) params.set("since", options.since);

    const query = params.toString();
    return api.get<TrailPoint[]>(
      `/tracking/deliveries/${deliveryId}/trail${query ? `?${query}` : ""}`,
    );
  },

  /**
   * Distance travelled and elapsed travel time for a delivery.
   *
   * Same role rules as the trail. Preferred over client-side summing so the
   * driver, admin and client views cannot disagree.
   */
  summary: (deliveryId: string) =>
    api.get<DeliverySummary>(`/tracking/deliveries/${deliveryId}/summary`),

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