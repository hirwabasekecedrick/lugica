"use client";

import { useEffect, useRef, useState } from "react";
import { connectTrackingSocket, type SocketStatus } from "@/lib/socket";
import type { DriverLivePosition } from "@/lib/api/types";

/**
 * Subscribe to a delivery's live driver position over the tracking gateway.
 *
 * Replaces the previous 5s poll of the whole trail. The trail is still fetched
 * once to draw the breadcrumb, but the moving marker is pushed — at the driver's
 * 3s transmission interval a poll faster than ~3s can only ever be a guess, and
 * a slower one shows a visibly stale position.
 *
 * Authorization is enforced by the gateway before it joins the room
 * (tracking.gateway.ts, `delivery:watch`), so a delivery belonging to another
 * customer never produces a position here.
 *
 * The socket token lives 5 minutes and is refetched on every (re)connect by
 * `connectTrackingSocket`, so the `watch` emit has to be repeated after a
 * reconnect rather than sent once — see the handler below.
 */
export type DeliveryTracking = {
  /** Transport state, for the status chip. */
  status: SocketStatus;
  /** Latest pushed position, or null until the driver reports one. */
  position: DriverLivePosition | null;
  /** Set when the gateway refused or lost the subscription. */
  error: string | null;
};

export function useDeliverySocket(
  deliveryId: string | null,
  enabled = true,
): DeliveryTracking {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [position, setPosition] = useState<DriverLivePosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Held in a ref so the live callback identity is stable and does not
  // re-subscribe on every position update.
  const deliveryIdRef = useRef(deliveryId);
  deliveryIdRef.current = deliveryId;

  useEffect(() => {
    if (!deliveryId || !enabled) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;

    connectTrackingSocket({
      onConnectionChange: setStatus,
      onDeliveryLocation: (next) => {
        // Ignore a late frame for a delivery the component has moved on from.
        if (next.deliveryId !== deliveryIdRef.current) return;
        setPosition(next);
      },
      onError: (message) => setError(message),
    })
      .then((connection) => {
        if (cancelled) {
          connection.dispose();
          return;
        }
        dispose = connection.dispose;

        connection.socket.on("connect", () => {
          setError(null);
          // Room membership does not survive a reconnect, so re-subscribe and
          // clear the stale refusal from the previous connection.
          connection.socket.emit("delivery:watch", { deliveryId });
        });

        if (connection.socket.connected) {
          connection.socket.emit("delivery:watch", { deliveryId });
        }
      })
      .catch(() => {
        // No socket token or the gateway is unreachable. The trail REST fetch
        // still works, so this is a degraded view rather than a broken page.
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
      dispose?.();
      dispose = null;
    };
  }, [deliveryId, enabled]);

  return { status, position, error };
}