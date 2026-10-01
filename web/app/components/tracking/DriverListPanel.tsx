"use client";

import { freshnessLabel, formatCoords } from "@/lib/format";
import type { DriverLiveState } from "@/lib/api/types";

/**
 * Live driver roster beside the map.
 *
 * Selecting a row focuses that driver on the map; `focusId` stays lifted to the
 * parent so the selection survives a socket push that reorders the list.
 */
type Props = {
  drivers: DriverLiveState[];
  focusId: string | null;
  onFocus: (driverId: string) => void;
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_delivery: "On delivery",
  offline: "Offline",
};

export default function DriverListPanel({ drivers, focusId, onFocus }: Props) {
  if (drivers.length === 0) {
    return (
      <div className="bg-page border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-text mb-2">Drivers</h3>
        <p className="text-xs text-text-muted">
          No driver is currently tracking. Positions appear here once a driver
          sends their first location ping.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-page border border-border rounded-xl p-5 space-y-2">
      <h3 className="text-sm font-bold text-text">
        Drivers <span className="text-text-muted font-normal">({drivers.length})</span>
      </h3>

      <ul className="space-y-1.5 max-h-[380px] overflow-y-auto">
        {drivers.map((driver) => {
          const active = driver.driverId === focusId;
          const hasPosition =
            typeof driver.lastLatitude === "number" && typeof driver.lastLongitude === "number";

          return (
            <li key={driver.driverId}>
              <button
                onClick={() => onFocus(driver.driverId)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? "bg-accent/20 border-accent/50"
                    : "bg-surface/60 border-border/40 hover:bg-sunken"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text truncate">
                    {driver.name || driver.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted flex-shrink-0">
                    {freshnessLabel(driver.lastSeenAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-text-muted truncate">
                    {STATUS_LABELS[driver.trackingStatus] ?? driver.trackingStatus}
                    {driver.vehiclePlateNumber && ` · ${driver.vehiclePlateNumber}`}
                  </span>
                  {driver.activeDeliveryId && (
                    <span className="text-[10px] font-mono text-text-muted truncate max-w-[110px]">
                      delivery {driver.activeDeliveryId.slice(0, 8)}
                    </span>
                  )}
                </div>

                {hasPosition && (
                  <p className="text-[10px] text-text-muted font-mono mt-1">
                    {formatCoords(driver.lastLatitude as number, driver.lastLongitude as number)}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}