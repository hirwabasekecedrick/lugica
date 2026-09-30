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
        <p className="text-xs text-text-muted">
          {vehicles.length} vehicles · {drivers.length} active drivers
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
        <div className="overflow-x-auto bg-page border border-border rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/70 border-b border-border text-text-muted text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Plate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Ownership</th>
                <th className="py-3 px-4">Assigned driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-sunken transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-text">{v.plateNumber}</td>
                  <td className="py-3 px-4 text-text">{v.type}</td>
                  <td className="py-3 px-4 text-text-muted font-mono">{v.capacity} kg</td>
                  <td className="py-3 px-4 text-text-muted">{v.ownershipType}</td>
                  <td className="py-3 px-4 text-text">
                    {v.assignedDriver?.name ?? <span className="text-text-muted">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        v.status === "ACTIVE"
                          ? "bg-accent/15 text-text-accent border-accent/30"
                          : "bg-warning/15 text-warning border-warning/30"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setAssignFor({ id: v.id, plate: v.plateNumber })}
                      className="px-2.5 py-1 bg-surface hover:bg-sunken border border-border text-text text-[11px] font-semibold rounded transition-colors cursor-pointer"
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
    "w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-text-muted outline-none focus:border-text-accent";

  return (
    <form onSubmit={submit} className="bg-page border border-border rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-text">New vehicle</h3>

      {error && (
        <p className="text-[11px] text-danger border border-danger/30 bg-danger/10 rounded-lg px-3 py-2">
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
        className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
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
      className="bg-page border border-accent/40 rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-text">Assign driver — {plate}</h3>
      <p className="text-[11px] text-text-muted">
        Any prior assignment is closed and a new assignment record is opened.
      </p>

      {error && (
        <p className="text-[11px] text-danger border border-danger/30 bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {drivers.length === 0 ? (
        <p className="text-[11px] text-warning">
          No active drivers exist. Create one under Users &amp; Drivers first.
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-text-accent"
          >
            <option value="">Select driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {pending ? "…" : "Assign"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-surface hover:bg-sunken border border-border text-text-muted rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
