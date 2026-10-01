"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectTrackingSocket, type SocketStatus } from "@/lib/socket";
import { useSendLocationPing } from "@/lib/api/hooks";
import type { Socket } from "socket.io-client";

/**
 * Driver-side tracking controls.
 *
 * The gateway's driver events are: `tracking:start` (become visible to admins),
 * `locationUpdate` (record a position, binding `deliveryId` as the active
 * delivery), and `tracking:stop`.
 *
 * Two independent mechanisms write positions, but they are NOT equivalent:
 *  - the socket path (`tracking:start` then `locationUpdate`) is the only one
 *    that publishes the driver to the admin live map. It writes
 *    `tracking:driver:{id}` and adds the id to `tracking:active_drivers`
 *    (tracking.service.ts:97, :140), which is what `GET /tracking/drivers` reads.
 *  - `POST /locations/ping` writes only `driver:location:{id}` plus a Postgres
 *    DriverLocation row (locations.service.ts:29-41). It therefore keeps the
 *    trail readable but never makes the driver appear live.
 *
 * The REST fallback is kept because a lost websocket should not lose the trip
 * record — but the admin map depends on the socket, which is called out in
 * docs/API-GAPS.md.
 */

/** The API throttles pings to 5/s; 10s is well inside that and battery-friendly. */
const PING_INTERVAL_MS = 10_000;

export type GeolocationState = "idle" | "watching" | "denied" | "unavailable";

export type DriverTracking = {
  /** Transport state of the socket, for the status chip. */
  status: SocketStatus;
  /** True between goOnline() and goOffline(). */
  online: boolean;
  geolocation: GeolocationState;
  lastSentAt: number | null;
  /**
   * Last error the gateway reported on this socket.
   *
   * Currently populated by the known API bug where the global ThrottlerGuard
   * throws on WebSocket handlers (docs/API-GAPS.md #23), which makes
   * `tracking:start` fail. Exposed so the UI can say so instead of pretending
   * the driver went online when the server never registered them.
   */
  lastError: string | null;
  goOnline: () => void;
  goOffline: () => void;
  /** Publish one fix now, outside the interval. */
  publishPosition: (
    coords: { latitude: number; longitude: number; accuracy?: number },
    deliveryId?: string | null,
  ) => void;
  /** The delivery the driver is currently on, attached to subsequent pings. */
  setActiveDelivery: (deliveryId: string | null) => void;
};

export function useDriverTracking(): DriverTracking {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [online, setOnline] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  /** Browser capability is a stable property, so it is read during render. */
  const geolocationSupported =
    typeof navigator !== "undefined" && Boolean(navigator.geolocation);

  const socketRef = useRef<Socket | null>(null);

  // Read inside the publish interval, which must not be torn down and rebuilt
  // every time the driver accepts or completes a delivery.
  const activeDeliveryRef = useRef<string | null>(null);

  const ping = useSendLocationPing();
  // Held in a ref so the publish interval keeps a stable identity across
  // re-renders. Assigned in an effect, never during render.
  const pingRef = useRef(ping);
  useEffect(() => {
    pingRef.current = ping;
  }, [ping]);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | null = null;

    connectTrackingSocket({
      onConnectionChange: setStatus,
      onError: (message) => setLastError(message),
    })
      .then((connection) => {
        if (cancelled) {
          connection.dispose();
          return;
        }
        dispose = connection.dispose;
        socketRef.current = connection.socket;
      })
      .catch(() => {
        // No socket token or the gateway is down. REST pings still work, so this
        // is a degraded state rather than a broken page.
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
      dispose?.();
      socketRef.current = null;
    };
  }, []);

  const publishPosition = useCallback<DriverTracking["publishPosition"]>(
    (coords, deliveryId) => {
      const socket = socketRef.current;

      if (socket?.connected) {
        // socket.io queues emits made before the handshake completes, so this is
        // safe even while `connecting`.
        socket.emit("locationUpdate", { ...coords, deliveryId: deliveryId ?? null });
        setLastSentAt(Date.now());
        return;
      }

      // Socket down: the Postgres trail still survives. Note this does NOT make
      // the driver visible on the admin live map — see the file header.
      pingRef.current
        .mutateAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(coords.accuracy != null ? { accuracy: coords.accuracy } : {}),
          ...(deliveryId ? { deliveryId } : {}),
        })
        .then(() => setLastSentAt(Date.now()))
        .catch(() => undefined);
    },
    [],
  );

  const goOnline = useCallback(() => {
    socketRef.current?.emit("tracking:start");
    setOnline(true);
    // Re-ask after a previous denial only once the driver has changed the
    // browser setting; clearing here just reflects the current toggle state.
    setPermissionDenied(false);
  }, []);

  const goOffline = useCallback(() => {
    socketRef.current?.emit("tracking:stop");
    setOnline(false);
    activeDeliveryRef.current = null;
  }, []);

  const setActiveDelivery = useCallback<DriverTracking["setActiveDelivery"]>(
    (deliveryId) => {
      activeDeliveryRef.current = deliveryId;
    },
    [],
  );

  /**
   * Watch the device GPS while online and publish on a fixed interval.
   *
   * `watchPosition` fires far more often than the API wants, so the newest fix
   * is parked in a local variable and drained by an interval rather than sent
   * per event.
   */
  useEffect(() => {
    // Nothing to watch while offline. `geolocation` is derived below rather than
    // reset here, which keeps this effect free of synchronous setState.
    if (!online || !geolocationSupported) return;

    let latest: GeolocationPosition | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        latest = position;
      },
      () => setPermissionDenied(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 },
    );

    const timer = setInterval(() => {
      if (!latest) return;

      publishPosition(
        {
          latitude: latest.coords.latitude,
          longitude: latest.coords.longitude,
          accuracy: latest.coords.accuracy,
        },
        activeDeliveryRef.current,
      );
    }, PING_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [online, geolocationSupported, publishPosition]);

  /**
   * Derived rather than stored: the effect above only ever reports the
   * permission result, and the "idle" / "unavailable" cases follow from
   * `online` and browser capability.
   */
  const geolocation: GeolocationState = !online
    ? "idle"
    : !geolocationSupported
      ? "unavailable"
      : permissionDenied
        ? "denied"
        : "watching";

  return {
    status,
    online,
    geolocation,
    lastSentAt,
    lastError,
    goOnline,
    goOffline,
    publishPosition,
    setActiveDelivery,
  };
}