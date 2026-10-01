"use client";

import { useEffect, useMemo } from "react";
import { AppFrame } from "@/app/components/AppFrame";
import { LoadingState, ErrorState, EmptyState } from "@/app/components/ui-states";
import LiveDriverMap from "@/app/components/tracking/LiveDriverMap";
import type { MapMarker } from "@/app/components/tracking/markers";
import {
  useDeliveries,
  useDeliveryTrail,
  useDriverTransition,
  useMyTrackingState,
} from "@/lib/api/hooks";
import { useDriverTracking } from "@/app/components/tracking/useDriverTracking";
import { deliveryStatusLabel, formatDateTime, freshnessLabel } from "@/lib/format";
import type { Delivery } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";

/**
 * The driver's whole job, on one screen, in the order they need it:
 *
 *   1. the journey in progress (PICKED_UP or IN_TRANSIT), with the dropoff
 *      marked on the map;
 *   2. jobs waiting to be accepted (ASSIGNED);
 *   3. journeys already made (DELIVERED or FAILED).
 *
 * This mirrors the API's state machine exactly rather than inventing its own
 * notion of "current": a driver can hold at most one non-terminal delivery, and
 * which bucket a card lands in is decided by `status`, never by a local
 * selection. See deliveries.service.ts:190-222 for the transitions.
 *
 * `GET /deliveries` is already role-filtered to `driverId = me`
 * (deliveries.service.ts:47-49), so the driver never sees anyone else's work.
 */

/** ASSIGNED: admin has handed it over, the driver has not accepted yet. */
const ACCEPTABLE: Delivery["status"][] = ["ASSIGNED"];
/** PICKED_UP / IN_TRANSIT: the journey is under way. */
const ACTIVE: Delivery["status"][] = ["PICKED_UP", "IN_TRANSIT"];
const CLOSED: Delivery["status"][] = ["DELIVERED", "FAILED", "CANCELLED"];

export default function DriverHomeClient() {
  const deliveriesQuery = useDeliveries();
  const myStateQuery = useMyTrackingState();
  const transition = useDriverTransition();
  const toast = useToast();
  const tracking = useDriverTracking();

  const deliveries = useMemo(() => deliveriesQuery.data ?? [], [deliveriesQuery.data]);

  const active = deliveries.find((d) => ACTIVE.includes(d.status)) ?? null;
  const assigned = deliveries.filter((d) => ACCEPTABLE.includes(d.status));
  const past = deliveries.filter((d) => CLOSED.includes(d.status));

  // Hook order is fixed: the trail query is enabled by the active delivery's id
  // rather than being mounted inside the conditional branch below.
  const trailQuery = useDeliveryTrail(active?.id ?? null);

  // Keep the tracker pointed at whatever the driver is actually carrying, so
  // every ping is bound to that delivery without re-subscribing on each change.
  useEffect(() => {
    tracking.setActiveDelivery(active?.id ?? null);
  }, [active?.id, tracking]);

  async function run(
    id: string,
    action: "pickup" | "transit" | "deliver" | "fail",
    message: string,
  ) {
    try {
      await transition.mutateAsync({ id, action });
      toast.success(message);
    } catch (err) {
      toast.error(
        "Action rejected",
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    }
  }

  return (
    <AppFrame
      title="My Deliveries"
      subtitle="Assigned jobs, the journey in progress, and your history"
      activeHref="/driver"
      sidebarItems={[
        { href: "/driver", label: "My Deliveries", badge: assigned.length },
        { href: "/shop", label: "Store" },
      ]}
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
      <div className="space-y-6">
        <TrackingBanner tracking={tracking} lastSeenAt={myStateQuery.data?.lastSeenAt ?? null} />

        {/*
          Loading and error states live inside the frame, not as an early return
          above it: a driver on a slow or flaky connection still needs the
          header, the sidebar and — most importantly — the online toggle, which
          is independent of the delivery query.
        */}
        {deliveriesQuery.isLoading ? (
          <LoadingState label="Loading your deliveries…" />
        ) : deliveriesQuery.isError ? (
          <ErrorState
            error={deliveriesQuery.error}
            onRetry={() => deliveriesQuery.refetch()}
          />
        ) : (
          <>
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text">Current journey</h2>
          {active ? (
            <ActiveJourney
              delivery={active}
              trailQuery={trailQuery}
              pending={transition.isPending}
              onAction={run}
            />
          ) : (
            <EmptyState
              title="No journey in progress"
              description="Accept an assigned job below to start a delivery."
            />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text">
            Assigned to you{" "}
            <span className="text-text-muted font-normal">({assigned.length})</span>
          </h2>

          {assigned.length === 0 ? (
            <p className="text-xs text-text-muted bg-page border border-border rounded-xl p-4">
              Nothing waiting. An administrator assigns jobs from the deliveries
              board, and they appear here immediately.
            </p>
          ) : (
            <ul className="space-y-2">
              {assigned.map((delivery) => (
                <li key={delivery.id}>
                  <DeliveryCard
                    delivery={delivery}
                    action={
                      <button
                        onClick={() => run(delivery.id, "pickup", "Job accepted")}
                        disabled={transition.isPending}
                        className="px-3 py-1.5 bg-accent hover:bg-border text-on-accent rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        Accept
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text">
            Past journeys{" "}
            <span className="text-text-muted font-normal">({past.length})</span>
          </h2>

          {past.length === 0 ? (
            <p className="text-xs text-text-muted bg-page border border-border rounded-xl p-4">
              Completed deliveries will be listed here.
            </p>
          ) : (
            <ul className="space-y-2">
              {past.map((delivery) => (
                <li key={delivery.id}>
                  <DeliveryCard delivery={delivery} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-[11px] text-text-muted">
          Signed in as a driver. Administrators manage assignments and see your
          position live while you are online.
        </p>
          </>
        )}
      </div>
    </AppFrame>
  );
}

/* ── Pieces ────────────────────────────────────────────────────────────────── */

function TrackingBanner({
  tracking,
  lastSeenAt,
}: {
  tracking: ReturnType<typeof useDriverTracking>;
  lastSeenAt: string | null;
}) {
  const { online, geolocation, status, lastSentAt, lastError } = tracking;

  const geoText = {
    idle: online ? "Waiting for a GPS fix…" : "Location sharing is off",
    watching: "Sharing your location",
    denied: "Location permission denied — ask for it in your browser settings",
    unavailable: "This browser has no geolocation support",
  }[geolocation];

  const transportText = {
    live: "Live connection",
    polling: "Polling fallback",
    connecting: "Connecting…",
    offline: "Offline — pings sent over HTTP",
  }[status];

  return (
    <div className="bg-page border border-border rounded-xl p-4 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-text">
          {online ? "Online" : "Offline"}
        </span>
        <span className="text-[10px] text-text-muted font-mono">
          {lastSentAt
            ? `last ping ${new Date(lastSentAt).toLocaleTimeString()}`
            : `last seen ${freshnessLabel(lastSeenAt)}`}
        </span>
      </div>

      <p className="text-[11px] text-text-muted">{geoText}</p>
      <p className="text-[11px] text-text-muted">{transportText}</p>

      {!online && (
        <p className="text-[11px] text-warning">
          Go online to make your position visible to administrators. Positions
          expire about 120 seconds after your last ping.
        </p>
      )}

      {/*
        The admin live map reads only the Redis state the socket writes, so a
        dropped websocket means pings keep recording your trail but nobody sees
        you move. Worth saying out loud rather than looking like a bug.
      */}
      {online && status !== "live" && (
        <p className="text-[11px] text-warning">
          Your live connection is degraded, so administrators will not see you on
          the map until it recovers. Your trip is still being recorded.
        </p>
      )}

      {/*
        Known API bug: the global ThrottlerGuard throws on WebSocket handlers,
        so `tracking:start` never reaches the service. The driver still becomes
        visible on the map as soon as the first location ping arrives, because
        that path calls startTracking internally. See docs/API-GAPS.md #23.
      */}
      {lastError && (
        <p className="text-[11px] text-text-muted">
          The server rejected a tracking request ({lastError}). You will appear on
          the admin map once your next location is sent.
        </p>
      )}
    </div>
  );
}

function ActiveJourney({
  delivery,
  trailQuery,
  pending,
  onAction,
}: {
  delivery: Delivery;
  trailQuery: ReturnType<typeof useDeliveryTrail>;
  pending: boolean;
  onAction: (
    id: string,
    action: "pickup" | "transit" | "deliver" | "fail",
    message: string,
  ) => void;
}) {
  /**
   * The dropoff is the destination the driver is navigating to, so it is the
   * marker the map is built around. The pickup is shown for orientation and
   * only before the package is collected.
   */
  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [
      {
        id: `dropoff-${delivery.id}`,
        latitude: delivery.dropoffLat,
        longitude: delivery.dropoffLng,
        kind: "dropoff",
        label: "Dropoff",
      },
    ];

    if (delivery.status === "PICKED_UP") {
      list.push({
        id: `pickup-${delivery.id}`,
        latitude: delivery.pickupLat,
        longitude: delivery.pickupLng,
        kind: "pickup",
        label: "Pickup",
      });
    }

    return list;
  }, [delivery]);

  return (
    <article className="bg-page border border-accent/40 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-text truncate">{delivery.dropoffAddress}</p>
          <p className="text-[11px] text-text-muted truncate">from {delivery.pickupAddress}</p>
          <p className="text-[11px] text-text-muted mt-1">
            {delivery.client?.name ?? "Client"} · {delivery.vehicle?.plateNumber ?? "no vehicle"}
          </p>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-accent/15 text-text-accent border-accent/30">
          {deliveryStatusLabel(delivery.status)}
        </span>
      </div>

      <LiveDriverMap
        markers={markers}
        trail={trailQuery.data}
        focusId={`dropoff-${delivery.id}`}
        className="h-[300px] w-full"
        emptyMessage="This delivery has no coordinates."
      />

      {trailQuery.data && trailQuery.data.length > 0 && (
        <p className="text-[11px] text-text-muted">
          {trailQuery.data.length} position
          {trailQuery.data.length === 1 ? "" : "s"} recorded
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {delivery.status === "PICKED_UP" && (
          <button
            onClick={() => onAction(delivery.id, "transit", "Journey started")}
            disabled={pending}
            className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            Start journey
          </button>
        )}

        {delivery.status === "IN_TRANSIT" && (
          <button
            onClick={() => onAction(delivery.id, "deliver", "Delivery completed")}
            disabled={pending}
            className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            Mark delivered
          </button>
        )}

        {delivery.status === "IN_TRANSIT" && (
          <button
            onClick={() => onAction(delivery.id, "fail", "Delivery marked as failed")}
            disabled={pending}
            className="px-4 py-2 bg-surface hover:bg-sunken border border-danger/40 text-danger rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            Report failure
          </button>
        )}
      </div>
    </article>
  );
}

function DeliveryCard({ delivery, action }: { delivery: Delivery; action?: React.ReactNode }) {
  return (
    <article className="bg-page border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-text truncate">{delivery.dropoffAddress}</p>
          <p className="text-[11px] text-text-muted truncate">from {delivery.pickupAddress}</p>
          <p className="text-[11px] text-text-muted mt-1">
            {delivery.client?.name ?? "Client"} ·{" "}
            {delivery.vehicle?.plateNumber ?? "no vehicle"} ·{" "}
            {delivery.deliveredAt
              ? `completed ${formatDateTime(delivery.deliveredAt)}`
              : `assigned ${formatDateTime(delivery.createdAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              delivery.status === "DELIVERED"
                ? "bg-accent/15 text-text-accent border-accent/30"
                : delivery.status === "FAILED" || delivery.status === "CANCELLED"
                  ? "bg-danger/15 text-danger border-danger/30"
                  : "bg-warning/15 text-warning border-warning/30"
            }`}
          >
            {deliveryStatusLabel(delivery.status)}
          </span>
          {action}
        </div>
      </div>
    </article>
  );
}