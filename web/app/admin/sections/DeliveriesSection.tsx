"use client";

import React, { useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "@/app/components/ui-states";
import {
  useAssignDelivery,
  useDeliveries,
  useDelivery,
  useUsers,
  useVehicles,
} from "@/lib/api/hooks";
import { deliveryStatusLabel, formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";

/**
 * Deliveries (list is role-aware; assign is ADMIN).
 *
 * Assignment is only possible on a PENDING delivery, requires a user with
 * Role.DRIVER, and requires an ACTIVE vehicle. The seed provides neither, so
 * this is the section most likely to show empty selects on a fresh database.
 */
export default function DeliveriesSection() {
  const deliveriesQuery = useDeliveries();
  const driversQuery = useUsers(1, "DRIVER");
  const vehiclesQuery = useVehicles();
  const assign = useAssignDelivery();
  const toast = useToast();

  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<string | null>(null);

  const deliveries = deliveriesQuery.data ?? [];
  const drivers = (driversQuery.data?.data ?? []).filter((d) => d.isActive);
  const activeVehicles = (vehiclesQuery.data ?? []).filter((v) => v.status === "ACTIVE");
  const pending = deliveries.filter((d) => d.status === "PENDING");

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6984A9]">
        {deliveries.length} deliveries · {pending.length} awaiting assignment
      </p>

      {assignFor && (
        <AssignDeliveryForm
          deliveryRef={assignFor}
          drivers={drivers.map((d) => ({ id: d.id, name: d.name }))}
          vehicles={activeVehicles.map((v) => ({ id: v.id, plate: v.plateNumber }))}
          onSubmit={async (driverId, vehicleId) => {
            await assign.mutateAsync({ id: assignFor, driverId, vehicleId });
            toast.success("Delivery assigned", "Status moved to ASSIGNED.");
            setAssignFor(null);
          }}
          onError={(message) => toast.error("Could not assign delivery", message)}
          pending={assign.isPending}
          onCancel={() => setAssignFor(null)}
        />
      )}

      {deliveriesQuery.isLoading ? (
        <LoadingState label="Loading deliveries…" />
      ) : deliveriesQuery.isError ? (
        <ErrorState error={deliveriesQuery.error} onRetry={() => deliveriesQuery.refetch()} />
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="No deliveries"
          description="Deliveries are created by clients through POST /deliveries; there is no web form for it yet."
        />
      ) : (
        <div className="overflow-x-auto bg-[#0d1525] border border-[#263B6A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Driver / vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-[#131e36]/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[10px] text-[#EEFABD] break-all max-w-[120px]">
                    {d.id}
                  </td>
                  <td className="py-3 px-4 text-white">
                    <p className="truncate max-w-[200px]">{d.pickupAddress}</p>
                    <p className="text-[10px] text-[#6984A9] truncate max-w-[200px]">
                      → {d.dropoffAddress}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[#6984A9]">{d.client?.name ?? "—"}</td>
                  <td className="py-3 px-4 text-white">
                    {d.driver?.name ?? <span className="text-[#6984A9]">—</span>}
                    {d.vehicle && (
                      <span className="block text-[10px] text-[#6984A9] font-mono">
                        {d.vehicle.plateNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        d.status === "DELIVERED"
                          ? "bg-[#A0D585]/15 text-[#A0D585] border-[#A0D585]/30"
                          : d.status === "FAILED" || d.status === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
                            : "bg-amber-400/15 text-amber-300 border-amber-400/30"
                      }`}
                    >
                      {deliveryStatusLabel(d.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {d.status === "PENDING" && (
                      <button
                        onClick={() => setAssignFor(d.id)}
                        className="px-2.5 py-1 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#EEFABD] text-[11px] font-semibold rounded cursor-pointer mr-1.5"
                      >
                        Assign
                      </button>
                    )}
                    <button
                      onClick={() => setDetailFor(detailFor === d.id ? null : d.id)}
                      className="px-2.5 py-1 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] text-[11px] font-semibold rounded cursor-pointer"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailFor && <DeliveryHistory id={detailFor} />}
    </div>
  );
}

function DeliveryHistory({ id }: { id: string }) {
  const detailQuery = useDelivery(id);

  return (
    <section className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">Status history</h3>

      {detailQuery.isLoading ? (
        <LoadingState label="Loading history…" />
      ) : detailQuery.isError ? (
        <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
      ) : (
        <div className="space-y-2">
          {(detailQuery.data?.statusHistory ?? []).map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#131e36]/40 border border-[#263B6A]/40 text-xs"
            >
              <div className="min-w-0">
                <p className="text-white">
                  {h.fromStatus ? `${h.fromStatus} → ` : ""}
                  <span className="text-[#A0D585] font-semibold">{h.toStatus}</span>
                </p>
                {h.notes && <p className="text-[10px] text-[#6984A9] truncate">{h.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#6984A9]">{h.changedBy?.name ?? "—"}</p>
                <p className="text-[10px] text-[#6984A9] font-mono">
                  {formatDateTime(h.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AssignDeliveryForm({
  deliveryRef,
  drivers,
  vehicles,
  onSubmit,
  onError,
  pending,
  onCancel,
}: {
  deliveryRef: string;
  drivers: { id: string; name: string }[];
  vehicles: { id: string; plate: string }[];
  onSubmit: (driverId: string, vehicleId: string) => Promise<unknown>;
  onError: (message: string) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const blockedReason =
    drivers.length === 0
      ? "No active drivers. Create one under Users & Drivers."
      : vehicles.length === 0
        ? "No active vehicles. Create one under Vehicles."
        : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!driverId || !vehicleId) {
      setError("Choose both a driver and a vehicle.");
      return;
    }
    try {
      await onSubmit(driverId, vehicleId);
    } catch (err) {
      // Server-side rejection -> toast; the inline box stays for the local
      // "pick both" check above.
      onError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-[#0d1525] border border-[#A0D585]/40 rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-white">Assign — {deliveryRef}</h3>
      <p className="text-[11px] text-[#6984A9]">
        Flips the delivery from PENDING to ASSIGNED and writes a status history entry, all in one
        transaction.
      </p>

      {error && (
        <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {blockedReason ? (
        <p className="text-[11px] text-amber-300 border border-amber-400/30 bg-amber-400/10 rounded-lg px-3 py-2">
          {blockedReason}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="flex-1 min-w-[160px] bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
          >
            <option value="">Select driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="flex-1 min-w-[160px] bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
          >
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {pending ? "Assigning…" : "Assign"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
