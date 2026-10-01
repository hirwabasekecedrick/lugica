"use client";

import React from "react";
import type { DeliverySummary } from "@/lib/api/types";

/**
 * Distance travelled and elapsed travel time for a delivery.
 *
 * One component for all three audiences — driver, admin, and the ordering
 * client — so the three views cannot present the same figure differently. Every
 * value is read from the API's summary endpoint rather than summed in the
 * browser: the raw trail is sampled for drawing, so summing the points the client
 * received would under-report a long trip.
 */

/** `2h 14m`, or `14m 06s` under an hour. */
function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";

  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatDistanceKm(distanceKilometers: number): string {
  if (!Number.isFinite(distanceKilometers)) return "—";
  // Under 10km, two decimals read as precision; above it they read as noise.
  if (distanceKilometers < 10) return `${distanceKilometers.toFixed(2)} km`;
  return `${Math.round(distanceKilometers)} km`;
}

export default function TripMetrics({
  summary,
  compact = false,
}: {
  summary: DeliverySummary | null | undefined;
  compact?: boolean;
}) {
  if (!summary) {
    return (
      <div className="bg-page border border-border rounded-xl p-4">
        <p className="text-xs text-text-muted">Distance and timing appear once the trip has started.</p>
      </div>
    );
  }

  const hasStarted = summary.pickedUpAt !== null;

  const stats = [
    {
      label: "Distance travelled",
      value: formatDistanceKm(summary.distanceKilometers),
      hint: `${summary.distanceMeters.toLocaleString()} m across ${summary.pointCount} GPS ${summary.pointCount === 1 ? "point" : "points"}`,
    },
    {
      label: summary.isTerminal ? "Total travel time" : "Elapsed travel time",
      // While the trip is running the API returns a server-computed elapsed value
      // that stops at the last fetch, so the ticking effect is driven locally
      // from pickedUpAt rather than by the displayed number.
      value: formatDuration(summary.elapsedSeconds),
      hint: hasStarted
        ? `From pickup${summary.terminalAt ? " to completion" : " · still running"}`
        : "Not yet picked up",
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{stat.label}</p>
            <p className="text-sm font-bold font-mono text-text">{stat.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-page border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{stat.label}</p>
          <p className="text-2xl font-bold font-mono text-text mt-1">{stat.value}</p>
          <p className="text-[11px] text-text-muted mt-1">{stat.hint}</p>
        </div>
      ))}
    </section>
  );
}