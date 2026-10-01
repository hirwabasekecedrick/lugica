"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrailPoint } from "@/lib/api/types";
import { markerIcon } from "./markerIcon";
import type { MapMarker } from "./markers";

/**
 * The Leaflet map itself.
 *
 * Split from LiveDriverMap so this module is only ever imported on the client —
 * Leaflet touches `window` at import time and will crash a server render.
 */

/** Kigali: the seed data and the whole operation are in Rwanda. */
const DEFAULT_CENTER: [number, number] = [-1.9441, 30.0619];

type Props = {
  markers: MapMarker[];
  /**
   * The breadcrumb: where the driver has actually been, oldest first.
   *
   * Drawn as a connecting line. Sampled by the API rather than fetched whole,
   * since a trip recorded at a 3s interval exceeds 1000 points within an hour.
   */
  trail?: TrailPoint[];
  /** Marker id to centre on. */
  focusId?: string | null;
  /** Pickup ("from") pin. */
  pickup?: [number, number] | null;
  /** Label shown in the pickup popup. */
  pickupLabel?: string | null;
  /** Drop-off ("to") pin. */
  dropoff?: [number, number] | null;
  /** Label shown in the drop-off popup. */
  dropoffLabel?: string | null;
  className?: string;
  emptyMessage?: string;
};

/**
 * Fit the viewport to the route as a whole: pickup, dropoff and trail.
 *
 * Without this a map opened at a fixed zoom can leave either end of the journey
 * off-screen. Recomputed only when the endpoint signature changes — not on every
 * position frame — so the viewport does not jump while the driver moves.
 */
function FitToRoute({
  trail,
  waypoints,
}: {
  trail: TrailPoint[];
  waypoints: [number, number][];
}) {
  const map = useMap();

  const signature = waypoints.map((p) => p.join(",")).join("|");
  const trailSignature = `${trail.length}:${trail[0]?.recordedAt ?? ""}:${
    trail[trail.length - 1]?.recordedAt ?? ""
  }`;

  useEffect(() => {
    const bounds: [number, number][] = [...waypoints];
    for (const p of trail) bounds.push([p.latitude, p.longitude]);
    if (bounds.length === 0) return;

    map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 15 });
    // Intentionally keyed on the endpoint signature only: refitting on every
    // pushed position would fight the driver's own panning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature, trailSignature]);

  return null;
}

/**
 * Recentre when the target changes.
 *
 * Leaflet needs `flyTo` after the container exists, so this is a child of
 * MapContainer rather than a ref held by the parent.
 */
function FlyToFocus({ focus }: { focus: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.latitude, focus.longitude], Math.max(map.getZoom(), 15), {
      duration: 0.8,
    });
  }, [focus, map]);

  return null;
}

/**
 * Keep every marker in view as drivers come and go.
 *
 * Only auto-fits when the marker set actually changes, otherwise a fresh ping
 * (which moves markers but keeps their ids) would fight the user's own panning.
 */
function FitToMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const signature = markers.map((m) => m.id).join(",");
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || markers.length === 0) return;

    const bounds = markers.map((m) => [m.latitude, m.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });

    // Fit once per marker-set change, not once per render.
    fitted.current = true;
  }, [signature, markers, map]);

  useEffect(() => {
    fitted.current = false;
  }, [signature]);

  return null;
}

export default function LiveDriverMapInner({
  markers,
  trail,
  focusId,
  pickup,
  pickupLabel,
  dropoff,
  dropoffLabel,
  className,
  emptyMessage = "No positions to show yet.",
}: Props) {
  const focus = useMemo(
    () => markers.find((m) => m.id === focusId) ?? null,
    [markers, focusId],
  );

  const path = useMemo(
    () =>
      (trail ?? []).map((p) => [p.latitude, p.longitude] as [number, number]),
    [trail],
  );

  /**
   * Breadcrumb plus the pickup and dropoff pins.
   *
   * With fewer than two recorded points there is no breadcrumb yet, so a direct
   * line is drawn from the driver's live position to the dropoff instead. That
   * is deliberately *not* a road route: the projected route previously came from
   * a third-party OSRM demo server called straight from the browser, which sent a
   * driver's live position to an external host on every position change. A
   * straight connector conveys the same "heading to the dropoff" at no privacy
   * or availability cost.
   */
  const connector = useMemo(() => {
    if (path.length > 1) return null;
    const from = focus ?? markers[0];
    if (!from || !dropoff) return null;
    return [
      [from.latitude, from.longitude] as [number, number],
      dropoff,
    ];
  }, [path.length, focus, markers, dropoff]);

  const routeWaypoints = [pickup, dropoff].filter(Boolean) as [number, number][];
  const hasRouteBounds = routeWaypoints.length > 0 || path.length > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className ?? "h-[420px] w-full"}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        // The app is light-themed; OSM's standard layer is the light variant.
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Where the goods are collected — the "from" of the journey. */}
        {pickup && (
          <Marker
            position={pickup}
            icon={markerIcon({ id: "pickup", ...asWaypoint(pickup), kind: "pickup", label: "Pickup" })}
          >
            <Popup>Pickup — {pickupLabel ?? "collection point"}</Popup>
          </Marker>
        )}

        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.latitude, marker.longitude]} icon={markerIcon(marker)}>
            <Popup>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>{marker.label}</strong>
                {marker.stale && <div style={{ color: "#556e96" }}>Stale — last known position</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Where the goods are going. */}
        {dropoff && (
          <Marker
            position={dropoff}
            icon={markerIcon({ id: "dropoff", ...asWaypoint(dropoff), kind: "dropoff", label: "Drop-off" })}
          >
            <Popup>Drop-off — {dropoffLabel ?? "destination"}</Popup>
          </Marker>
        )}

        {/* Path actually driven. */}
        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: "var(--color-text-accent)", weight: 3, opacity: 0.75 }}
          />
        )}

        {/* Direct connector, only while the breadcrumb is too short to draw. */}
        {connector && (
          <Polyline
            positions={connector}
            pathOptions={{ color: "var(--color-text-accent)", weight: 2, opacity: 0.4, dashArray: "6, 8" }}
          />
        )}

        <FlyToFocus focus={focus} />
        {/* Route fit wins when there is a route, otherwise fall back to the
            driver markers. Running both would let a late-arriving driver marker
            yank the viewport back off the fitted route. */}
        {hasRouteBounds ? (
          <FitToRoute trail={trail ?? []} waypoints={routeWaypoints} />
        ) : (
          <FitToMarkers markers={markers} />
        )}
      </MapContainer>

      {markers.length === 0 && !pickup && (
        <div className="absolute inset-0 flex items-center justify-center bg-page/80 backdrop-blur-[1px]">
          <p className="text-xs font-semibold text-text-muted">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function asWaypoint(position: [number, number]) {
  return { latitude: position[0], longitude: position[1] };
}