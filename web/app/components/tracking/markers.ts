import { isStalePing } from "@/lib/format";
import type { DriverLiveState } from "@/lib/api/types";

/**
 * Marker model and the pure mapping from driver state to markers.
 *
 * This module must stay free of any Leaflet import. Leaflet touches `window`
 * while it is being evaluated, so importing it here would crash the server
 * render of any component that merely needs `driverMarkers` — which is exactly
 * what happened with `LiveTrackingSection` before this was split out.
 * `markerIcon` (the only Leaflet-dependent part) lives in ./markerIcon, which
 * is reachable only through the `ssr: false` boundary in LiveDriverMap.tsx.
 */

/**
 * Deliberately not `DriverLiveState`: the driver map plots the dropoff of the
 * active journey, which has no driver at it, and the admin map needs a stale
 * flag the API never sends (it drops stale drivers from Redis entirely).
 */
export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind: "driver" | "dropoff" | "pickup";
  label: string;
  /** Rendered grey with a "Stale" tag. Ignored for non-driver markers. */
  stale?: boolean;
  /** Driver carrying an active delivery gets the filled accent treatment. */
  onDelivery?: boolean;
};

/** Marker styling driven by the app's semantic tokens, not Leaflet defaults. */
const MARKER_COLORS = {
  live: { fill: "var(--color-accent)", ring: "var(--color-on-accent)" },
  busy: { fill: "var(--color-text-accent)", ring: "var(--color-on-accent)" },
  stale: { fill: "#9aa3b2", ring: "#556e96" },
  dropoff: { fill: "var(--color-danger)", ring: "var(--color-on-accent)" },
  pickup: { fill: "var(--color-surface)", ring: "var(--color-text)" },
} as const;

/** Glyph inside the pin, per marker kind. */
export const GLYPHS: Record<MapMarker["kind"], string> = {
  driver: "&#9679;",
  dropoff: "&#9679;",
  pickup: "&#9675;",
};

/**
 * Marker labels come from user-controlled fields (driver name, address), and
 * Leaflet's divIcon takes raw HTML, so the text is escaped before interpolation.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paletteFor(marker: MapMarker) {
  return marker.stale
    ? MARKER_COLORS.stale
    : marker.kind === "dropoff"
      ? MARKER_COLORS.dropoff
      : marker.kind === "pickup"
        ? MARKER_COLORS.pickup
        : marker.onDelivery
          ? MARKER_COLORS.busy
          : MARKER_COLORS.live;
}

/** Turn live driver state into markers, preserving stale drivers. */
export function driverMarkers(drivers: DriverLiveState[]): MapMarker[] {
  return drivers
    .filter((d) => typeof d.lastLatitude === "number" && typeof d.lastLongitude === "number")
    .map((d) => ({
      id: d.driverId,
      latitude: d.lastLatitude as number,
      longitude: d.lastLongitude as number,
      kind: "driver" as const,
      // The API's `name` is nullable and often absent; the email local-part is
      // the only always-present human identifier.
      label: d.name || d.email.split("@")[0] || d.driverId.slice(0, 8),
      stale: isStalePing(d.lastSeenAt),
      onDelivery: d.trackingStatus === "on_delivery" || Boolean(d.activeDeliveryId),
    }));
}
