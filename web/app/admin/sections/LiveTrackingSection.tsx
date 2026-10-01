"use client";

import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "@/app/components/ui-states";
import {
  useActiveDrivers,
  useDeliveries,
  useDeliverySummary,
  useDeliveryTrail,
} from "@/lib/api/hooks";
import LiveDriverMap from "@/app/components/tracking/LiveDriverMap";
import DriverListPanel from "@/app/components/tracking/DriverListPanel";
import TripMetrics from "@/app/components/tracking/TripMetrics";
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
 *
 * Focusing a driver also loads that driver's active delivery: its breadcrumb, its
 * pickup and drop-off, and its distance/elapsed figures. All three come from the
 * API rather than being recomputed here, so the admin figure is identical to the
 * one the driver and the customer are seeing.
 */
export default function LiveTrackingSection() {
  const [focusId, setFocusId] = useState<string | null>(null);
  const socketStatus = useDriverSocket(true);
  const driversQuery = useActiveDrivers();

  const drivers = useMemo(() => driversQuery.data ?? [], [driversQuery.data]);

  const markers = useMemo(() => driverMarkers(drivers), [drivers]);

  // Default to the first driver so the map is never showing the whole fleet with
  // no route context when exactly one driver is on shift.
  const effectiveFocus = focusId ?? drivers[0]?.driverId ?? null;
  const focused = drivers.find((d) => d.driverId === effectiveFocus) ?? null;
  const focusedDeliveryId = focused?.activeDeliveryId ?? null;

  // The delivery detail supplies the pickup/drop-off coordinates the live state
  // does not carry. Only the focused driver's delivery is fetched.
  const deliveriesQuery = useDeliveries({ enabled: Boolean(focusedDeliveryId) });
  const focusedDelivery = useMemo(() => {
    if (!focusedDeliveryId) return null;
    return (deliveriesQuery.data ?? []).find((d) => d.id === focusedDeliveryId) ?? null;
  }, [deliveriesQuery.data, focusedDeliveryId]);

  const trailQuery = useDeliveryTrail(focusedDeliveryId);
  const summaryQuery = useDeliverySummary(focusedDeliveryId);

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
        <div className="space-y-4">
          <LiveDriverMap
            markers={markers}
            trail={trailQuery.data}
            focusId={effectiveFocus}
            pickup={
              focusedDelivery
                ? ([focusedDelivery.pickupLat, focusedDelivery.pickupLng] as [number, number])
                : null
            }
            pickupLabel={focusedDelivery?.pickupAddress ?? null}
            dropoff={
              focusedDelivery
                ? ([focusedDelivery.dropoffLat, focusedDelivery.dropoffLng] as [number, number])
                : null
            }
            dropoffLabel={focusedDelivery?.dropoffAddress ?? null}
            emptyMessage="No driver is currently sending location updates."
          />

          {focusedDeliveryId ? (
            <TripMetrics summary={summaryQuery.data} />
          ) : (
            <p className="text-[11px] text-text-muted bg-page border border-border rounded-xl p-3">
              {focused
                ? `${focused.name || focused.email} is online but not carrying a delivery, so there is no route or distance to show.`
                : "Select a driver to see their route, distance travelled, and elapsed time."}
            </p>
          )}
        </div>

        <DriverListPanel drivers={drivers} focusId={effectiveFocus} onFocus={setFocusId} />
      </div>

      {staleCount > 0 && (
        <p className="text-[11px] text-text-muted">
          Stale markers keep their last known position. The API expires a driver
          from Redis about 120 seconds after their final ping, so a marker stops
          moving well before it disappears.
        </p>
      )}

      {/*
        Foreground-only transmission is a browser limit, not an API fault: a
        driver whose phone is locked or whose tab is backgrounded stops sending.
        At a 3s interval that is soon visible as a frozen marker, so it is called
        out to avoid reading as a gateway fault.
      */}
      <p className="text-[11px] text-text-muted">
        Drivers transmit every 3 seconds while the driver app is open and in the
        foreground. Browsers suspend location updates in the background, so a
        frozen marker often means the driver's app is no longer foregrounded.
      </p>
    </div>
  );
}