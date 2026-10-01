"use client";

import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "@/app/components/ui-states";
import { useActiveDrivers } from "@/lib/api/hooks";
import LiveDriverMap from "@/app/components/tracking/LiveDriverMap";
import DriverListPanel from "@/app/components/tracking/DriverListPanel";
import { driverMarkers } from "@/app/components/tracking/markers";
import { useDriverSocket } from "@/app/components/tracking/useDriverSocket";
import { isStalePing } from "@/lib/format";

const STATUS_TEXT: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "text-text-accent" },
  polling: { label: "Polling fallback", className: "text-warning" },
  connecting: { label: "Connecting…", className: "text-text-muted" },
  offline: { label: "Offline — polling", className: "text-warning" },
};

/**
 * ADMIN live tracking: every tracking driver on one map.
 *
 * Read-only by design. The API has no admin-side command for a driver's
 * position, and an admin moving a driver would contradict the trail recorded in
 * Postgres; actions live on the driver's own page.
 */
export default function LiveTrackingSection() {
  const [focusId, setFocusId] = useState<string | null>(null);
  const socketStatus = useDriverSocket(true);
  const driversQuery = useActiveDrivers();

  const drivers = useMemo(() => driversQuery.data ?? [], [driversQuery.data]);

  const markers = useMemo(() => driverMarkers(drivers), [drivers]);

  // Stale drivers stay on the map: the API drops them from Redis after ~120s,
  // so a disappearance is not the same event as a stop.
  const liveCount = drivers.filter((d) => !isStalePing(d.lastSeenAt)).length;
  const staleCount = drivers.length - liveCount;

  const status = STATUS_TEXT[socketStatus] ?? STATUS_TEXT.offline;

  if (driversQuery.isLoading) return <LoadingState label="Loading live drivers…" />;

  if (driversQuery.isError) {
    return (
      <ErrorState error={driversQuery.error} onRetry={() => driversQuery.refetch()} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>{liveCount} live</span>
          {staleCount > 0 && <span className="text-warning">{staleCount} stale</span>}
          <span>
            Updated <span className="font-mono">{driversQuery.dataUpdatedAt ? new Date(driversQuery.dataUpdatedAt).toLocaleTimeString() : "—"}</span>
          </span>
        </div>

        <span className={`text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <LiveDriverMap
          markers={markers}
          focusId={focusId}
          emptyMessage="No driver is currently sending location pings."
        />

        <DriverListPanel drivers={drivers} focusId={focusId} onFocus={setFocusId} />
      </div>

      {staleCount > 0 && (
        <p className="text-[11px] text-text-muted">
          Stale markers keep their last known position. The API expires a driver
          from Redis about 120 seconds after their final ping, so a marker stops
          moving well before it disappears.
        </p>
      )}
    </div>
  );
}