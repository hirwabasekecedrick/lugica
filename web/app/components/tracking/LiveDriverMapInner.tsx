"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
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
  /** Drawn as a connecting line, oldest first. */
  trail?: TrailPoint[];
  /** Marker id to centre on. */
  focusId?: string | null;
  className?: string;
  emptyMessage?: string;
};

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

        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: "var(--color-text-accent)", weight: 3, opacity: 0.75 }}
          />
        )}

        <FitToMarkers markers={markers} />
        <FlyToFocus focus={focus} />
      </MapContainer>

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-page/80 backdrop-blur-[1px]">
          <p className="text-xs font-semibold text-text-muted">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}