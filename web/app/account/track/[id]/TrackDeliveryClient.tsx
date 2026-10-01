"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { deliveries } from "@/lib/api/deliveries";
import { useDeliverySocket } from "@/app/components/tracking/useDeliverySocket";
import { useDeliverySummary, useDeliveryTrail } from "@/lib/api/hooks";
import LiveDriverMap from "@/app/components/tracking/LiveDriverMap";
import TripMetrics from "@/app/components/tracking/TripMetrics";
import type { MapMarker } from "@/app/components/tracking/markers";
import { LoadingState, ErrorState } from "@/app/components/ui-states";

/**
 * Live delivery progress for the customer who placed the order.
 *
 * Three sources of truth, deliberately kept distinct:
 *  - the delivery itself, for pickup/drop-off and status (polled slowly);
 *  - the recorded trail, fetched once, for the breadcrumb;
 *  - the socket, for the moving marker.
 *
 * The previous version polled the entire trail every 5 seconds, which at the
 * driver's 3s transmission interval could only ever show a stale position and
 * re-download the whole path on every tick.
 */

const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED", "FAILED"];

const LIVE_STATUS_TEXT: Record<string, string> = {
  live: "Live",
  polling: "Live (polling fallback)",
  connecting: "Connecting…",
  offline: "Offline — position may be stale",
};

function DeliveryStatusBadge({ status }: { status: string }) {
  const isComplete = status === "DELIVERED";
  const isError = status === "CANCELLED" || status === "FAILED";
  const isActive = ["IN_TRANSIT", "PICKED_UP", "ASSIGNED"].includes(status);

  let className = "bg-surface border-border text-text-muted";
  if (isComplete) className = "bg-status text-on-status border-status/30";
  if (isError) className = "bg-danger text-white border-danger/30";
  if (isActive) className = "bg-accent text-on-accent border-accent/30";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function TrackDeliveryClient({ id }: { id: string }) {
  const { data: delivery, isLoading, error, refetch } = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => deliveries.byId(id),
    // Status changes are pushed on the tracking socket too, but the delivery
    // record is the authority for a terminal state, so it is polled slowly as
    // a safety net rather than every 10s as before.
    refetchInterval: 30_000,
  });

  const trailQuery = useDeliveryTrail(id);
  const summaryQuery = useDeliverySummary(id);

  const isTerminal = delivery ? TERMINAL_STATUSES.includes(delivery.status) : false;

  // `isTerminal` is false until the delivery loads, so the socket subscribes
  // immediately and is torn down once a terminal status arrives: a live
  // subscription on a finished delivery just looks broken, since the driver has
  // stopped transmitting.
  const socket = useDeliverySocket(id, !isTerminal);

  const trail = trailQuery.data ?? [];

  /**
   * Breadcrumb plus the pushed marker.
   *
   * The pushed position is appended to the stored trail so the polyline grows
   * without a refetch; the trail query itself is not invalidated, because its
   * `cumulativeDistanceMeters` is a snapshot and the summary is what is displayed.
   */
  const path = useMemo(() => {
    if (!socket.position) return trail;
    return [
      ...trail,
      {
        latitude: socket.position.latitude,
        longitude: socket.position.longitude,
        accuracy: socket.position.accuracy,
        recordedAt: socket.position.timestamp,
      },
    ];
  }, [trail, socket.position]);

  /** A single driver marker. The customer sees one driver, not a fleet. */
  const markers = useMemo<MapMarker[]>(() => {
    if (!delivery) return [];
    if (socket.position) {
      return [
        {
          id: "driver",
          latitude: socket.position.latitude,
          longitude: socket.position.longitude,
          kind: "driver",
          label: delivery.driver?.name || "Your driver",
          onDelivery: true,
        },
      ];
    }

    // Before the first pushed position, fall back to the newest recorded point.
    const last = trail[trail.length - 1];
    if (!last) return [];
    return [
      {
        id: "driver",
        latitude: last.latitude,
        longitude: last.longitude,
        kind: "driver",
        label: delivery.driver?.name || "Your driver",
        stale: true,
        onDelivery: true,
      },
    ];
  }, [delivery, socket.position, trail]);

  const statusText = isTerminal
    ? "Trip finished"
    : (LIVE_STATUS_TEXT[socket.status] ?? LIVE_STATUS_TEXT.offline);

  return (
    <div className="min-h-screen bg-page text-text flex flex-col font-sans">
      <header className="bg-surface border-b border-border sticky top-0 z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="w-10 h-10 rounded-full bg-sunken hover:bg-border flex items-center justify-center transition-colors text-text"
              aria-label="Back to account"
            >
              &larr;
            </Link>
            <h1 className="text-xl font-black">Live Tracking</h1>
          </div>

          {!isTerminal && (
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socket.status === "offline" ? "bg-warning" : "bg-accent animate-pulse"
                }`}
              />
              {statusText}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        {isLoading ? (
          <LoadingState label="Loading delivery details..." />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !delivery ? (
          <ErrorState error={new Error("Delivery not found")} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Status</p>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Destination</p>
                <p className="text-sm font-semibold">{delivery.dropoffAddress}</p>
              </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-surface border border-border rounded-2xl overflow-hidden relative shadow-lg">
              {isTerminal && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center text-3xl mb-4">
                    {delivery.status === "DELIVERED" ? "✓" : "✕"}
                  </div>
                  <h2 className="text-2xl font-black mb-2">
                    {delivery.status === "DELIVERED" ? "Delivery Complete" : "Delivery Terminated"}
                  </h2>
                  <p className="text-text-muted max-w-md">
                    {delivery.status === "DELIVERED"
                      ? "Your package has been successfully delivered. Thank you for shopping with us!"
                      : "This delivery was cancelled or failed. Please contact support for assistance."}
                  </p>
                </div>
              )}

              <LiveDriverMap
                markers={markers}
                trail={path}
                pickup={[delivery.pickupLat, delivery.pickupLng]}
                pickupLabel={delivery.pickupAddress}
                dropoff={[delivery.dropoffLat, delivery.dropoffLng]}
                dropoffLabel={delivery.dropoffAddress}
                className="h-[500px] w-full"
                emptyMessage="Waiting for your driver's first location update."
              />
            </div>

            <TripMetrics summary={summaryQuery.data} />

            {socket.error && (
              <p className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg p-3">
                Live updates unavailable: {socket.error}. The route shown is the last
                recorded position.
              </p>
            )}

            {!isTerminal && markers.length === 0 && (
              <p className="text-xs text-text-muted">
                Your driver appears here once they start their journey. Tracking is
                only transmitted while the driver's app is open and in the foreground.
              </p>
            )}

            {delivery.driver && (
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent text-on-accent flex items-center justify-center font-black text-lg">
                  {delivery.driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Your Driver</p>
                  <p className="text-sm font-black">{delivery.driver.name}</p>
                </div>
                {delivery.vehicle && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Vehicle</p>
                    <p className="text-sm font-semibold">{delivery.vehicle.plateNumber}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}