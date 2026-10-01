"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectTrackingSocket, type SocketStatus } from "@/lib/socket";
import { qk } from "@/lib/api/hooks";
import type { DriverLiveState } from "@/lib/api/types";

/**
 * Subscribe to the tracking gateway for as long as the component is mounted.
 *
 * Push and poll are combined on purpose. `driversUpdate` is the low-latency
 * path, but the socket can drop silently behind a proxy or a sleeping laptop,
 * and a missed push would otherwise freeze the map until a manual reload. The
 * polling query keeps running underneath as the recovery path; this hook only
 * writes into the cache when a push actually arrives, and a socket failure is
 * surfaced as a status rather than an error, since the page is still usable.
 */
export function useDriverSocket(enabled: boolean): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const qc = useQueryClient();

  // Guards against a late resolve after unmount tearing down a fresh socket.
  const disposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const onDrivers = (drivers: DriverLiveState[]) => {
      // Write through the query cache so the map, the list and the badge counts
      // all read from one source instead of holding a second copy in state.
      qc.setQueryData(qk.activeDrivers(), drivers);
    };

    connectTrackingSocket({ onDrivers, onConnectionChange: setStatus })
      .then((connection) => {
        if (cancelled) {
          connection.dispose();
          return;
        }
        disposeRef.current = connection.dispose;
      })
      .catch(() => {
        // No socket token (e.g. signed out) or the gateway is down. Polling
        // still works, so this is a degraded state, not a broken page.
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [enabled, qc]);

  return status;
}