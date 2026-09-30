"use client";

import React, { useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "@/app/components/ui-states";
import {
  useAssignVehicleDriver,
  useCreateVehicle,
  useUsers,
  useVehicles,
} from "@/lib/api/hooks";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";

/**
 * Fleet (ADMIN only).
 *
 * `CreateVehicleDto` enforces ownership consistency server-side: INDIVIDUAL
 * requires ownedByDriverId, COMPANY rejects it (vehicles.service.ts). The form
 * mirrors that so the constraint is visible rather than a server rejection.
 */
export default function VehiclesSection() {
  const vehiclesQuery = useVehicles();
  const driversQuery = useUsers(1, "DRIVER");
  const createVehicle = useCreateVehicle();
  const assignDriver = useAssignVehicleDriver();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [assignFor, setAssignFor] = useState<{ id: string; plate: string } | null>(null);

  const vehicles = vehiclesQuery.data ?? [];
  const drivers = (driversQuery.data?.data ?? []).filter((d) => d.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6984A9]">
          {vehicles.length} vehicles · {drivers.length} active drivers
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          {showCreate ? "Close" : "New vehicle"}
        </button>
      </div>

      {showCreate && (
        <CreateVehicleForm
          drivers={drivers.map((d) => ({ id: d.id, name: d.name }))}
          onSubmit={async (input) => {
            await createVehicle.mutateAsync(input);
            toast.success("Vehicle added", input.plateNumber);
          }}
          onError={(message) => toast.error("Could not add vehicle", message)}
          pending={createVehicle.isPending}
          onDone={() => setShowCreate(false)}
        />
      )}

      {assignFor && (
        <AssignDriverForm
          plate={assignFor.plate}
          drivers={drivers.map((d) => ({ id: d.id, name: d.name }))}
          onSubmit={async (driverId) => {
            await assignDriver.mutateAsync({ id: assignFor.id, driverId });
            toast.success("Driver assigned", assignFor.plate);
            setAssignFor(null);
          }}
          pending={assignDriver.isPending}
          onCancel={() => setAssignFor(null)}
        />
      )}

      {vehiclesQuery.isLoading ? (
        <LoadingState label="Loading vehicles…" />
      ) : vehiclesQuery.isError ? (
        <ErrorState error={vehiclesQuery.error} onRetry={() => vehiclesQuery.refetch()} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          description="Add a vehicle so deliveries can be assigned to it."
        />
      ) : (
        <div className="overflow-x-auto bg-[#0d1525] border border-[#263B6A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Plate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Ownership</th>
                <th className="py-3 px-4">Assigned driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-[#131e36]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#EEFABD]">{v.plateNumber}</td>
                  <td className="py-3 px-4 text-white">{v.type}</td>
                  <td className="py-3 px-4 text-[#6984A9] font-mono">{v.capacity} kg</td>
                  <td className="py-3 px-4 text-[#6984A9]">{v.ownershipType}</td>
                  <td className="py-3 px-4 text-white">
                    {v.assignedDriver?.name ?? <span className="text-[#6984A9]">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        v.status === "ACTIVE"
                          ? "bg-[#A0D585]/15 text-[#A0D585] border-[#A0D585]/30"
                          : "bg-amber-400/15 text-amber-300 border-amber-400/30"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setAssignFor({ id: v.id, plate: v.plateNumber })}
                      className="px-2.5 py-1 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#EEFABD] text-[11px] font-semibold rounded transition-colors cursor-pointer"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateVehicleForm({
  drivers,
  onSubmit,
  onError,
  pending,
  onDone,
}: {
  drivers: { id: string; name: string }[];
  onSubmit: (input: {
    plateNumber: string;
    type: string;
    capacity: number;
    ownershipType: "COMPANY" | "INDIVIDUAL";
    ownedByDriverId?: string;
  }) => Promise<unknown>;
  onError: (message: string) => void;
  pending: boolean;
  onDone: () => void;
}) {
  const [plateNumber, setPlateNumber] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ownershipType, setOwnershipType] = useState<"COMPANY" | "INDIVIDUAL">("COMPANY");
  const [ownedByDriverId, setOwnedByDriverId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      setError("Capacity must be a positive number of kilograms.");
      return;
    }
    if (ownershipType === "INDIVIDUAL" && !ownedByDriverId) {
      setError("An individually owned vehicle must name its owner.");
      return;
    }

    try {
      await onSubmit({
        plateNumber,
        type,
        capacity: cap,
        ownershipType,
        // COMPANY vehicles must not carry an owner id.
        ownedByDriverId: ownershipType === "INDIVIDUAL" ? ownedByDriverId : undefined,
      });
      onDone();
    } catch (err) {
      // Server-side rejection -> toast; the inline box stays for the local
      // capacity/ownership checks above.
      onError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }

  const inputClass =
    "w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]";

  return (
    <form onSubmit={submit} className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-white">New vehicle</h3>

      {error && (
        <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="RAD 123 A" className={`${inputClass} font-mono`} required />
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (van, truck…)" className={inputClass} required />
        <input type="number" min={0} step="0.1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity (kg)" className={`${inputClass} font-mono`} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={ownershipType}
          onChange={(e) => setOwnershipType(e.target.value as "COMPANY" | "INDIVIDUAL")}
          className={inputClass}
        >
          <option value="COMPANY">Company owned</option>
          <option value="INDIVIDUAL">Driver owned</option>
        </select>

        {ownershipType === "INDIVIDUAL" && (
          <select
            value={ownedByDriverId}
            onChange={(e) => setOwnedByDriverId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create vehicle"}
      </button>
    </form>
  );
}

function AssignDriverForm({
  plate,
  drivers,
  onSubmit,
  pending,
  onCancel,
}: {
  plate: string;
  drivers: { id: string; name: string }[];
  onSubmit: (driverId: string) => Promise<unknown>;
  pending: boolean;
  onCancel: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!driverId) {
      setError("Choose a driver.");
      return;
    }
    try {
      await onSubmit(driverId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-[#0d1525] border border-[#A0D585]/40 rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-white">Assign driver — {plate}</h3>
      <p className="text-[11px] text-[#6984A9]">
        Any prior assignment is closed and a new assignment record is opened.
      </p>

      {error && (
        <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {drivers.length === 0 ? (
        <p className="text-[11px] text-amber-300">
          No active drivers exist. Create one under Users &amp; Drivers first.
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="flex-1 bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
          >
            <option value="">Select driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {pending ? "…" : "Assign"}
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
