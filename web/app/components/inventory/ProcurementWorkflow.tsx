"use client";

import React, { useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "../ui-states";
import {
  useAdminProducts,
  useCreateGoodsReceipt,
  useCreateSupplier,
  useGoodsReceipts,
  useSuppliers,
} from "@/lib/api/hooks";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";

/**
 * Procurement: record goods receipts.
 *
 * The DTO refines that quantityDelivered must equal
 * quantityAccepted + quantityRejected, so the row UI keeps that identity
 * enforced before submitting rather than letting the API 400.
 */
interface LineRow {
  productId: string;
  quantityDelivered: string;
  quantityAccepted: string;
  unitCost: string;
  batchNumber: string;
}

export default function ProcurementWorkflow({
  preselectedProductId,
  onClearPreselectedProduct,
}: {
  preselectedProductId?: string | null;
  onClearPreselectedProduct?: () => void;
}) {
  const suppliersQuery = useSuppliers();
  const productsQuery = useAdminProducts();
  const receiptsQuery = useGoodsReceipts();
  const createReceipt = useCreateGoodsReceipt();
  const createSupplier = useCreateSupplier();
  const toast = useToast();

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [deliveredByName, setDeliveredByName] = useState("");
  const [deliveredByPhone, setDeliveredByPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const products = (productsQuery.data ?? []).filter((p) => p.status === "ACTIVE");

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        productId: preselectedProductId ?? products[0]?.id ?? "",
        quantityDelivered: "",
        quantityAccepted: "",
        unitCost: "",
        batchNumber: "",
      },
    ]);
  }

  function updateLine(index: number, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supplierId) return setError("Select a supplier.");
    if (!deliveredByName.trim()) return setError("Enter who delivered the goods.");
    if (lines.length === 0) return setError("Add at least one line item.");

    for (const [i, line] of lines.entries()) {
      if (!line.productId) return setError(`Line ${i + 1}: choose a product.`);
      const delivered = Number(line.quantityDelivered);
      const accepted = Number(line.quantityAccepted);
      if (!Number.isInteger(delivered) || delivered < 1) {
        return setError(`Line ${i + 1}: quantity delivered must be at least 1.`);
      }
      if (!Number.isInteger(accepted) || accepted < 0 || accepted > delivered) {
        return setError(
          `Line ${i + 1}: accepted must be between 0 and the delivered quantity.`,
        );
      }
      if (!Number.isInteger(Number(line.unitCost)) || Number(line.unitCost) < 0) {
        return setError(`Line ${i + 1}: enter a valid unit cost.`);
      }
    }

    try {
      await createReceipt.mutateAsync({
        supplierId,
        deliveredByName,
        deliveredByPhone: deliveredByPhone || undefined,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined,
        items: lines.map((l) => {
          const delivered = Number(l.quantityDelivered);
          const accepted = Number(l.quantityAccepted);
          return {
            productId: l.productId,
            quantityDelivered: delivered,
            quantityAccepted: accepted,
            // Rejected is derived, keeping the DTO identity satisfied.
            quantityRejected: delivered - accepted,
            unitCostMinorUnits: Number(l.unitCost),
            batchNumber: l.batchNumber || undefined,
          };
        }),
      });

      setLines([]);
      setDeliveredByName("");
      setDeliveredByPhone("");
      setInvoiceNumber("");
      setNotes("");
      onClearPreselectedProduct?.();
      toast.success("Goods receipt recorded", "Accepted stock has been added to inventory.");
    } catch (err) {
      // Server-side rejection -> toast. The inline box handles the per-line
      // validation above, which is about the form's own fields.
      toast.error(
        "Could not record receipt",
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    }
  }

  if (productsQuery.isLoading || suppliersQuery.isLoading) {
    return <LoadingState label="Loading procurement…" />;
  }

  const inputClass =
    "w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]";

  return (
    <div className="space-y-5">
      <section className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white">Record a goods receipt</h3>
        <p className="text-[11px] text-[#6984A9]">
          Accepted quantities are added to stock immediately, with a RECEIPT movement recorded per
          line.
        </p>

        {error && (
          <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6984A9] mb-1">
                Supplier
              </label>
              <div className="flex gap-2">
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
                  <option value="">Select…</option>
                  {(suppliersQuery.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowSupplierForm(!showSupplierForm)}
                  className="px-3 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  {showSupplierForm ? "Close" : "New"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6984A9] mb-1">
                Delivered by
              </label>
              <input
                value={deliveredByName}
                onChange={(e) => setDeliveredByName(e.target.value)}
                placeholder="e.g. Bob Driver"
                className={inputClass}
              />
            </div>
          </div>

          {showSupplierForm && (
            <NewSupplierForm
              onSubmit={async (name) => {
                await createSupplier.mutateAsync({ name });
                setShowSupplierForm(false);
                toast.success("Supplier added", name);
              }}
              pending={createSupplier.isPending}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={deliveredByPhone}
              onChange={(e) => setDeliveredByPhone(e.target.value)}
              placeholder="Deliverer phone (optional)"
              className={inputClass}
            />
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Invoice / reference (optional)"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6984A9]">
                Line items
              </span>
              <button
                type="button"
                onClick={addLine}
                disabled={products.length === 0}
                className="px-2.5 py-1 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#A0D585] rounded text-[11px] font-semibold cursor-pointer disabled:opacity-40"
              >
                + Add line
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="text-[11px] text-[#6984A9] py-4 text-center bg-[#131e36]/40 border border-[#263B6A]/50 rounded-lg">
                No lines yet. Add the products being received.
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select
                      value={line.productId}
                      onChange={(e) => updateLine(i, { productId: e.target.value })}
                      className={`${inputClass} sm:col-span-4`}
                    >
                      <option value="">Product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={line.quantityDelivered}
                      onChange={(e) => updateLine(i, { quantityDelivered: e.target.value })}
                      placeholder="Delivered"
                      className={`${inputClass} sm:col-span-2 font-mono`}
                    />
                    <input
                      type="number"
                      min={0}
                      value={line.quantityAccepted}
                      onChange={(e) => updateLine(i, { quantityAccepted: e.target.value })}
                      placeholder="Accepted"
                      className={`${inputClass} sm:col-span-2 font-mono`}
                    />
                    <input
                      type="number"
                      min={0}
                      value={line.unitCost}
                      onChange={(e) => updateLine(i, { unitCost: e.target.value })}
                      placeholder="Unit cost"
                      className={`${inputClass} sm:col-span-2 font-mono`}
                    />
                    <input
                      value={line.batchNumber}
                      onChange={(e) => updateLine(i, { batchNumber: e.target.value })}
                      placeholder="Batch"
                      className={`${inputClass} sm:col-span-1 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="sm:col-span-1 text-[#6984A9] hover:text-rose-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={`${inputClass} min-h-[60px] resize-y`}
          />

          <button
            type="submit"
            disabled={createReceipt.isPending}
            className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {createReceipt.isPending ? "Recording…" : "Record receipt"}
          </button>
        </form>
      </section>

      <section className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Receipt log</h3>
        <p className="text-[11px] text-[#6984A9] mb-4">
          Line items are not included in the list response; open a receipt for its detail.
        </p>

        {receiptsQuery.isLoading ? (
          <LoadingState label="Loading receipts…" />
        ) : receiptsQuery.isError ? (
          <ErrorState error={receiptsQuery.error} onRetry={() => receiptsQuery.refetch()} />
        ) : (receiptsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No receipts recorded" description="Record one above to restock." />
        ) : (
          <div className="space-y-2">
            {(receiptsQuery.data ?? []).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#131e36]/40 border border-[#263B6A]/40"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {r.supplier?.name ?? "Supplier"}
                  </p>
                  <p className="text-[10px] text-[#6984A9]">
                    {r.deliveredByName} · {formatDate(r.receivedAt)}
                    {r.invoiceNumber && ` · ${r.invoiceNumber}`}
                  </p>
                </div>
                <span className="text-[10px] text-[#6984A9] font-mono flex-shrink-0">
                  {r.items ? `${r.items.length} lines` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NewSupplierForm({
  onSubmit,
  pending,
}: {
  onSubmit: (name: string) => Promise<unknown>;
  pending: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <div className="flex gap-2 items-end">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Supplier name"
        className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
      />
      <button
        type="button"
        onClick={() => name.trim() && onSubmit(name.trim())}
        disabled={pending || !name.trim()}
        className="px-3 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#A0D585] rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-40"
      >
        {pending ? "…" : "Add"}
      </button>
    </div>
  );
}
