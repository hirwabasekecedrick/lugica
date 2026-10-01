import { io, type Socket } from "socket.io-client";
import { tracking } from "@/lib/api/tracking";
import type { DriverLivePosition } from "@/lib/api/types";

/**
 * Socket.IO client for the tracking gateway.
 *
 * The API has no CORS headers for the browser (docs/API-GAPS.md #2), but the
 * gateway explicitly opts in with `cors: { origin: "*" }`
 * (tracking.gateway.ts:31-38), so a direct socket connection from the browser
 * works even though REST must go through the BFF.
 *
 * Transports are listed websocket-first with polling as the fallback, matching
 * the gateway's own `transports: ['websocket', 'polling']`. socket.io-client
 * walks that list automatically when a websocket upgrade is blocked, so a
 * corporate proxy or an offline laptop degrades to polling rather than failing.
 */

export type SocketStatus = "connecting" | "live" | "polling" | "offline";

/**
 * The gateway is reached directly, so it needs a browser-visible origin. The
 * server-only `API_ORIGIN` in lib/server/config.ts cannot be used here — it
 * reads secrets and is never bundled — hence a separate NEXT_PUBLIC_ variable.
 */
const SOCKET_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN?.trim() || "http://localhost:8080";

export type TrackingSocketHandlers = {
  /** ADMIN only: the full driver list. Pushed on connect and after every ping. */
  onDrivers?: (drivers: import("@/lib/api/types").DriverLiveState[]) => void;
  /** ADMIN only: reply to an explicit `drivers:list` request. */
  onStatusChange?: (payload: {
    deliveryId: string;
    status: string;
    driverId: string | null;
    clientId: string;
  }) => void;
  /**
   * The assigned driver or the owning client's position, pushed whenever the
   * driver's position changes.
   *
   * Delivered to a socket that joined the delivery's room via `delivery:watch`.
   * The gateway authorises that join, so receipt implies permission.
   */
  onDeliveryLocation?: (position: DriverLivePosition) => void;
  onConnectionChange?: (status: SocketStatus) => void;
  /**
   * Errors the gateway reports to this socket.
   *
   * Worth wiring up: the gateway's `WsExceptionFilter` converts thrown errors
   * into an `error` event and swallows the exception, so a handler that fails
   * server-side is otherwise completely silent on the client.
   */
  onError?: (message: string) => void;
};

export type TrackingSocket = {
  socket: Socket;
  dispose: () => void;
};

/**
 * Connect, authenticate, and wire the handlers.
 *
 * Authentication is a handshake concern, not an HTTP one: the gateway reads
 * `auth.token` or `Authorization: Bearer` and rejects the connection outright
 * otherwise (tracking.gateway.ts:298-311). The token is short-lived, so a new
 * one is fetched on every (re)connect attempt rather than cached.
 */
export async function connectTrackingSocket(
  handlers: TrackingSocketHandlers = {},
): Promise<TrackingSocket> {
  const token = await tracking.socketToken();

  const socket = io(SOCKET_ORIGIN, {
    auth: { token },
    transports: ["websocket", "polling"],
    // Start with the fallback so a blocked upgrade degrades immediately instead
    // of stalling the connection past the caller's timeout.
    tryAllTransports: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });

  let disposed = false;

  socket.on("connect", () => {
    // `socket.io.engine.transport.name` is the transport actually in use, so
    // the UI can say "polling fallback" instead of pretending it is a websocket.
    const name = socket.io.engine?.transport?.name;
    handlers.onConnectionChange?.(name === "polling" ? "polling" : "live");
  });

  socket.on("disconnect", () => {
    if (!disposed) handlers.onConnectionChange?.("offline");
  });

  socket.io.on("reconnect_attempt", () => {
    handlers.onConnectionChange?.("connecting");
  });

  if (handlers.onDrivers) {
    socket.on("driversUpdate", handlers.onDrivers);
  }

  if (handlers.onStatusChange) {
    socket.on("deliveryStatusChanged", handlers.onStatusChange);
  }

  if (handlers.onDeliveryLocation) {
    socket.on("deliveryLocationUpdate", handlers.onDeliveryLocation);
  }

  if (handlers.onError) {
    socket.on("error", (payload: unknown) => {
      const message =
        typeof payload === "string"
          ? payload
          : ((payload as { message?: string })?.message ?? "Tracking socket error");

      handlers.onError?.(message);
    });
  }

  return {
    socket,
    dispose: () => {
      disposed = true;
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}