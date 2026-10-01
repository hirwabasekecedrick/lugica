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
 *  - the socket path (`tracking:start` then `locationUpdate`) publishes the
 *    driver to the admin live map and to anyone watching their delivery, and
 *    pushes `deliveryLocationUpdate` to that delivery's room.
 *  - `POST /locations/ping` is the fallback used when the socket is unavailable.
 *    Since API-GAPS.md #21 was fixed it writes the *same* live-state keys the
 *    socket does, so a driver who only pings is now visible on the admin map too;
 *    what it cannot do is push to subscribers, because there is no socket to
 *    push from.
 *
 * The REST fallback is kept because a lost websocket should not lose the trip
 * record, and because `ping` is the only transport available to a client that
 * cannot hold a socket open at all.
 */

/**
 * Transmission interval for driver positions.
 *
 * 3s is the dispatch requirement. Both rate limits tolerate it comfortably:
 * `POST /locations/ping` allows 5 req/s (locations.controller.ts) and the global
 * limiter allows 100 req/60s, so a driver at 3s uses 20 of the 100 per minute.
 *
 * `maximumAge` on the watch is kept below the publish interval so each tick
 * tends to carry a genuinely fresh fix. A 5s cache would return a position up to
 * one full cycle old, making the interval effectively 6s on a slow device.
 */
const PING_INTERVAL_MS = 3_000;

/** Maximum staleness the browser will serve from its own position cache. */
const GEOLOCATION_MAX_AGE_MS = 2_000;

export type GeolocationState =
  | "idle"
  | "watching"
  | "paused"
  | "denied"
  | "unavailable";

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
   * Populated from the gateway's `error` event. `WsExceptionFilter` converts a
   * thrown error into an `error` event and swallows the exception, so a handler
   * that fails server-side is otherwise silent on the client.
   */
  lastError: string | null;
  /**
   * True when the browser has suspended the page (backgrounded tab, locked
   * screen).
   *
   * Browsers throttle and then stop `watchPosition` in this state, so no position
   * is being transmitted even though the driver is "online". At a 3s interval
   * that gap is plainly visible on the admin map, so the UI states it instead of
   * showing a healthy-looking live chip while recording nothing.
   */
  visible: boolean;
  goOnline: () => void;
  goOffline: () => void;
  /** Publish one fix now, outside the interval. */
  publishPosition: (
    coords: { latitude: number; longitude: number; accuracy?: number },
    deliveryId?: string | null,
  ) => void;
  /** The delivery the driver is currently on, attached to subsequent pings. */
  setActiveDelivery: (deliveryId: string | null) => void;
  /**
   * Most recent position the driver transmitted, or null before the first ping.
   *
   * Lets a delivery page draw the driver's own marker without a second request,
   * and keeps the marker moving between server round trips.
   */
  lastKnownPosition: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
};

export function useDriverTracking(): DriverTracking {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [online, setOnline] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastKnownPosition, setLastKnownPosition] = useState<DriverTracking["lastKnownPosition"]>(null);

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

      // Recorded before the transport is chosen, so the driver's own map moves
      // whether or not the socket is currently usable.
      setLastKnownPosition({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? null,
      });

      if (socket?.connected) {
        // socket.io queues emits made before the handshake completes, so this is
        // safe even while `connecting`.
        socket.emit("locationUpdate", { ...coords, deliveryId: deliveryId ?? null });
        setLastSentAt(Date.now());
        return;
      }

      // Socket down: the trail still survives, and since #21 the live state is
      // written too — but no subscriber is pushed, so watchers see nothing
      // until this client reconnects.
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
   * Track page visibility so the UI can report that transmission has stopped.
   *
   * `document.visibilityState` is read on the event rather than polled, and the
   * initial value comes from state so the first render is already correct.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  /**
   * Watch the device GPS while online and publish on a fixed interval.
   *
   * `watchPosition` fires far more often than the API wants, so the newest fix
   * is parked in a local variable and drained by an interval rather than sent
   * per event. Parking rather than throttling-by-time also means a tick is never
   * skipped: if the watch fired at 0.1s and again at 2.9s, the 3s tick publishes
   * the 2.9s fix.
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
      {
        enableHighAccuracy: true,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
        timeout: 20_000,
      },
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
   * Derived rather than stored: the effects above only report the permission
   * result and page visibility, and the "idle" / "unavailable" cases follow from
   * `online` and browser capability.
   */
  const geolocation: GeolocationState = !online
    ? "idle"
    : !geolocationSupported
      ? "unavailable"
      : permissionDenied
        ? "denied"
        : !visible
          ? "paused"
          : "watching";

  return {
    status,
    online,
    geolocation,
    lastSentAt,
    lastError,
    visible,
    goOnline,
    goOffline,
    publishPosition,
    setActiveDelivery,
    lastKnownPosition,
  };
}