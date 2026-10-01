"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { deliveries } from "@/lib/api/deliveries";
import {
  useDeliverySummary,
  useDeliveryTrail,
  useDeliverDelivery,
  usePickupDelivery,
  useTransitDelivery,
} from "@/lib/api/hooks";
import { AppFrame } from "@/app/components/AppFrame";
import { DeliveryIcon } from "@/app/components/sidebar-icons";
import LiveDriverMap from "@/app/components/tracking/LiveDriverMap";
import TripMetrics from "@/app/components/tracking/TripMetrics";
import { useDriverTracking } from "@/app/components/tracking/useDriverTracking";
import type { MapMarker } from "@/app/components/tracking/markers";
import { LoadingState, ErrorState, InlineError } from "@/app/components/ui-states";
import { useToast } from "@/app/components/ToastProvider";

/**
 * A single delivery for the driver carrying it.
 *
 * Ported from `/driver1/deliveries/[id]`. Two changes of substance:
 *
 *  - telemetry comes from `useDriverTracking`, the shared hook, instead of the
 *    driver1-local `watchPosition` + REST ping loop. The old loop never made the
 *    driver visible on the admin live map, because it bypassed the socket path
 *    that populates the live state (docs/API-GAPS.md #21). The hook prefers the
 *    socket and falls back to REST.
 *  - the map is the shared `LiveDriverMap`, so it draws pickup, driver and
 *    drop-off from the tokenized marker set rather than CDN-hosted Leaflet icons.
 *
 * `GET /deliveries/:id` is already role-filtered server-side, so a driver cannot
 * open another driver's delivery by guessing an id.
 */
export default function DeliveryDetailClient({ id }: { id: string }) {
  const toast = useToast();

  const { data: delivery, isLoading, error, refetch } = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => deliveries.byId(id),
  });

  const pickupMutation = usePickupDelivery();
  const transitMutation = useTransitDelivery();
  const deliverMutation = useDeliverDelivery();

  const trailQuery = useDeliveryTrail(id);
  const summaryQuery = useDeliverySummary(id);

  /**
   * Telemetry for this delivery.
   *
   * `setActiveDelivery` binds subsequent pings to this delivery, which is what
   * makes the trail readable and the admin map able to show whose job it is.
   * Until the driver goes online there is nothing to transmit, so the "Live
   * Tracking Active" banner keys off `geolocation === "watching"`.
   */
  const tracking = useDriverTracking();
  const trackingRef = React.useRef(tracking);
  trackingRef.current = tracking;

  /**
   * Bind subsequent pings to this delivery.
   *
   * This is what makes the trail readable and lets the admin map attribute the
   * position to a job. Kept in an effect rather than during render so the hook's
   * publish interval — which reads the ref — is never torn down by a re-render.
   */
  React.useEffect(() => {
    trackingRef.current.setActiveDelivery(id);
  }, [id]);

  const sidebarGroups = useMemo(
    () => [
      { items: [{ key: "deliveries", label: "My Deliveries", href: "/driver", icon: DeliveryIcon }] },
    ],
    [],
  );

  if (isLoading) {
    return (
      <AppFrame title="Delivery Details" sidebarGroups={sidebarGroups}>
        <LoadingState label="Loading delivery details…" />
      </AppFrame>
    );
  }

  if (error || !delivery) {
    return (
      <AppFrame title="Delivery Details" sidebarGroups={sidebarGroups}>
        <ErrorState error={error || new Error("Delivery not found")} onRetry={() => refetch()} />
      </AppFrame>
    );
  }

  const isTrackable = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status);

  async function handleAction(action: "pickup" | "transit" | "deliver") {
    try {
      if (action === "pickup") {
        await pickupMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as PICKED UP");
      } else if (action === "transit") {
        await transitMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as IN TRANSIT");
      } else if (action === "deliver") {
        await deliverMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as DELIVERED");
      }
    } catch (err) {
      // ApiError extends Error, so the API's own message survives the narrowing.
      const message = err instanceof Error ? err.message : "";
      toast.error("Update failed", message || "Failed to update delivery status");
    }
  }

  const busy = pickupMutation.isPending || transitMutation.isPending || deliverMutation.isPending;

  const trail = trailQuery.data ?? [];

  /** The driver's own marker. Falls back to the newest recorded point. */
  const markers: MapMarker[] = useMemo(() => {
    const live = trackingRef.current.lastKnownPosition;
    if (live) {
      return [
        {
          id: "me",
          latitude: live.latitude,
          longitude: live.longitude,
          kind: "driver",
          label: "You",
          onDelivery: true,
        },
      ];
    }
    const last = trail[trail.length - 1];
    if (!last) return [];
    return [
      {
        id: "me",
        latitude: last.latitude,
        longitude: last.longitude,
        kind: "driver",
        label: "You",
        stale: true,
        onDelivery: true,
      },
    ];
  }, [trackingRef.current.lastKnownPosition, trail]);

  const statusTone =
    delivery.status === "DELIVERED"
      ? "bg-accent/20 text-text-accent"
      : delivery.status === "PENDING"
        ? "bg-sunken text-text-muted"
        : "bg-warning/20 text-warning";

  return (
    <AppFrame
      title={`Delivery ${delivery.id.split("-")[0].toUpperCase()}`}
      subtitle="Delivery Details"
      sidebarGroups={sidebarGroups}
      actions={
        <button
          onClick={() => (tracking.online ? tracking.goOffline() : tracking.goOnline())}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
            tracking.online
              ? "bg-surface border border-border text-text-muted hover:bg-sunken"
              : "bg-accent text-on-accent hover:bg-border"
          }`}
        >
          {tracking.online ? "Go offline" : "Go online"}
        </button>
      }
    >
      <div className="max-w-6xl w-full grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          {tracking.geolocation === "denied" && isTrackable && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong>Location Access Denied.</strong> You must allow location access in your browser for live tracking to work.
              </div>
            </div>
          )}

          {tracking.geolocation === "paused" && isTrackable && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong>Tracking paused.</strong> Your browser suspends location
                updates while this page is in the background or the screen is
                locked, so nothing is being transmitted. Keep this page in the
                foreground while driving.
              </div>
            </div>
          )}

          {tracking.geolocation === "watching" && isTrackable && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text-accent flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <strong>Live Tracking Active.</strong> Your position is being shared
                every 3 seconds while this page is open.
              </div>
            </div>
          )}

          <TripMetrics summary={summaryQuery.data} />

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-sunken mb-4">
              <h3 className="text-sm font-bold text-text">Current Status</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusTone}`}>
                {delivery.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {delivery.status === "ASSIGNED" && (
                <button
                  onClick={() => handleAction("pickup")}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Accept & Pick Up
                </button>
              )}
              {delivery.status === "PICKED_UP" && (
                <button
                  onClick={() => handleAction("transit")}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Start Transit
                </button>
              )}
              {delivery.status === "IN_TRANSIT" && (
                <button
                  onClick={() => handleAction("deliver")}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}
              {delivery.status === "DELIVERED" && (
                <div className="flex-1 py-2.5 bg-sunken text-text-muted font-bold text-xs rounded-xl text-center">
                  Delivery Complete
                </div>
              )}
            </div>

            <div className="mt-4">
              <InlineError
                message={
                  pickupMutation.error?.message ||
                  transitMutation.error?.message ||
                  deliverMutation.error?.message ||
                  null
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Pickup Location</h3>
              <p className="text-xs text-text">{delivery.pickupAddress}</p>
              <div className="text-[10px] text-text-muted font-mono bg-sunken p-2 rounded">
                Lat: {delivery.pickupLat} <br /> Lng: {delivery.pickupLng}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Dropoff Location</h3>
              <p className="text-xs text-text">{delivery.dropoffAddress}</p>
              <div className="text-[10px] text-text-muted font-mono bg-sunken p-2 rounded">
                Lat: {delivery.dropoffLat} <br /> Lng: {delivery.dropoffLng}
              </div>
            </div>
          </div>

          {delivery.client && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Client Details</h3>
              <p className="text-xs text-text font-medium">{delivery.client.name}</p>
              <p className="text-xs text-text-muted">{delivery.client.email}</p>
            </div>
          )}
        </div>

        <div className="xl:col-span-7 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4 overflow-hidden h-full flex flex-col">
            <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Delivery Map</h3>
            <LiveDriverMap
              markers={markers}
              trail={trail}
              pickup={[delivery.pickupLat, delivery.pickupLng]}
              pickupLabel={delivery.pickupAddress}
              dropoff={[delivery.dropoffLat, delivery.dropoffLng]}
              dropoffLabel={delivery.dropoffAddress}
              className="w-full flex-1 min-h-[500px]"
              emptyMessage="Your position appears here once tracking is active."
            />
          </div>
        </div>
      </div>
    </AppFrame>
  );
}