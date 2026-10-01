"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/app/components/ui-states";
import type { MapMarker } from "./markers";
import type { TrailPoint } from "@/lib/api/types";

/**
 * Client-only boundary for the Leaflet map.
 *
 * `ssr: false` is required rather than merely preferred: Leaflet reads
 * `window.navigator` and `document` during module evaluation, so importing it
 * into a server render throws before React ever reaches the component.
 *
 * This file stays the only module a page imports; `ssr: false` is illegal in a
 * Server Component, hence the "use client" directive.
 */
const LiveDriverMapInner = dynamic(() => import("./LiveDriverMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-xl border border-border bg-page">
      <LoadingState label="Loading map…" />
    </div>
  ),
});

type Props = {
  markers: MapMarker[];
  trail?: TrailPoint[];
  focusId?: string | null;
  className?: string;
  emptyMessage?: string;
};

export default function LiveDriverMap(props: Props) {
  return <LiveDriverMapInner {...props} />;
}