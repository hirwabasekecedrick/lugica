import L from "leaflet";
import { escapeHtml, paletteFor, GLYPHS, type MapMarker } from "./markers";

/**
 * Builds the Leaflet DivIcon for a marker.
 *
 * The only Leaflet-dependent code in the tracking map, deliberately isolated:
 * Leaflet reads `window` at module-evaluation time, so this file must only ever
 * be reached through the `ssr: false` boundary in LiveDriverMap.tsx. Importing
 * it from a component that renders on the server throws "window is not defined".
 */
export function markerIcon(marker: MapMarker): L.DivIcon {
  const palette = paletteFor(marker);

  const tag = marker.stale
    ? `<span style="opacity:.75;font-weight:600">Stale</span>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="
        width:26px;height:26px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${palette.fill};
        border:2px solid ${palette.ring};
        box-shadow:0 1px 3px rgba(38,59,106,.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:13px;color:#fff;line-height:1">${GLYPHS[marker.kind]}</span>
      </div>
      <span style="
        max-width:130px;
        padding:1px 6px;
        border-radius:999px;
        background:#fff;
        border:1px solid var(--color-border);
        color:var(--color-text);
        font-size:10px;
        font-weight:600;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        box-shadow:0 1px 2px rgba(38,59,106,.18);
      ">${escapeHtml(marker.label)}${tag ? ` &middot; ${tag}` : ""}</span>
    </div>
  `;

  // Anchor on the pin tip so the point lands on the coordinate, not the label.
  return L.divIcon({
    html,
    className: "",
    iconSize: [26, 44],
    iconAnchor: [13, 42],
    popupAnchor: [0, -38],
  });
}
