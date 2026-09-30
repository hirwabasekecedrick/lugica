"use client";

import React, { useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "../ui-states";
import ProductIcon from "./ProductIcon";
import {
  useAdjustStock,
  useAdminProducts,
  useArchiveProduct,
  useCategories,
  useCreateProduct,
} from "@/lib/api/hooks";
import { formatMoney, stockState, LOW_STOCK_THRESHOLD } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";

/**
 * Inventory catalog.
 *
 * Differences from the mock UI, all forced by the API:
 *  - Products carry no `stock` input on create; initial stock must go through
 *    `POST /admin/products/:id/stock-adjustment` with a reason.
 *  - There is no delete, only archive (docs/API-GAPS.md #13).
 *  - Archived products are returned by the admin list and are filtered out
 *    here, with a toggle to reveal them.
 */
export default function InventoryCatalog({
  createOpen,
  onCreateOpenChange,
}: {
  /** Lets the sidebar open the "new product" form from outside this component. */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const productsQuery = useAdminProducts();
  const categoriesQuery = useCategories();
  const archive = useArchiveProduct();
  const adjustStock = useAdjustStock();
  const createProduct = useCreateProduct();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [ownShowCreate, setOwnShowCreate] = useState(false);
  // Controlled when the parent passes createOpen, so the sidebar can open it.
  const showCreate = createOpen ?? ownShowCreate;
  const setShowCreate = (open: boolean) => {
    setOwnShowCreate(open);
    onCreateOpenChange?.(open);
  };
  const [adjustFor, setAdjustFor] = useState<{ id: string; name: string } | null>(null);

  const products = productsQuery.data ?? [];

  const categories = (() => {
    const flat: { id: string; name: string }[] = [];
    const walk = (nodes: typeof categoriesQuery.data) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name });
        walk(n.children);
      }
    };
    walk(categoriesQuery.data);
    return flat;
  })();

  const visible = products
    .filter((p) => (showArchived ? true : p.status === "ACTIVE"))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category?.name ?? "").toLowerCase().includes(q)
      );
    });

  const lowStockCount = products.filter(
    (p) => p.status === "ACTIVE" && stockState(p.stockQuantity) !== "in-stock",
  ).length;

  if (productsQuery.isLoading) return <LoadingState label="Loading catalog…" />;
  if (productsQuery.isError) {
    return <ErrorState error={productsQuery.error} onRetry={() => productsQuery.refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category…"
            className="w-full bg-surface border border-border focus:border-text-accent rounded-lg pl-9 pr-3 py-2 text-xs text-text placeholder-text-muted outline-none"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-accent"
          />
          Show archived
        </label>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          {showCreate ? "Close" : "New product"}
        </button>
      </div>

      {lowStockCount > 0 && (
        <p className="text-xs text-warning">
          {lowStockCount} active SKU{lowStockCount === 1 ? "" : "s"} at or below{" "}
          {LOW_STOCK_THRESHOLD} units.
        </p>
      )}

      {showCreate && (
        <CreateProductForm
          categories={categories}
          onSubmit={async (input) => {
            await createProduct.mutateAsync(input);
            toast.success("Product created", input.name);
          }}
          onError={(message) => toast.error("Could not create product", message)}
          pending={createProduct.isPending}
        />
      )}

      {adjustFor && (
        <StockAdjustmentForm
          productName={adjustFor.name}
          onSuccess={() => {
            toast.success("Stock updated", adjustFor.name);
            setAdjustFor(null);
          }}
          onError={(message) => toast.error("Could not adjust stock", message)}
          onSubmit={async (delta, reason) => {
            await adjustStock.mutateAsync({ id: adjustFor.id, quantityDelta: delta, reason });
          }}
          pending={adjustStock.isPending}
          onCancel={() => setAdjustFor(null)}
        />
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="No products found"
          description={search ? "Try a different search term." : "Create a product to get started."}
        />
      ) : (
        <div className="overflow-x-auto bg-page border border-border rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/70 border-b border-border text-text-muted text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {visible.map((p) => {
                const state = stockState(p.stockQuantity);
                return (
                  <tr key={p.id} className="hover:bg-sunken transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                          <ProductIcon name={p.name} className="w-4 h-4 text-text-accent" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate max-w-[220px]">{p.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-accent whitespace-nowrap">
                      {formatMoney(p.priceMinorUnits, p.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          state === "out-of-stock"
                            ? "text-danger"
                            : state === "low-stock"
                              ? "text-warning"
                              : "text-text"
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.status === "ACTIVE"
                            ? "bg-accent/15 text-text-accent border-accent/30"
                            : "bg-accent/15 text-text-muted border-accent/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setAdjustFor({ id: p.id, name: p.name })}
                        className="px-2.5 py-1 bg-surface hover:bg-sunken border border-border text-text text-[11px] font-semibold rounded transition-colors cursor-pointer mr-1.5"
                      >
                        Adjust
                      </button>
                      {p.status === "ACTIVE" && (
                        <button
                          onClick={() =>
                            archive.mutate(p.id, {
                              onSuccess: () => toast.success("Archived", `${p.name} is hidden from the storefront.`),
                              onError: (err) => toast.error("Could not archive", (err as Error).message),
                            })
                          }
                          disabled={archive.isPending}
                          className="px-2.5 py-1 bg-surface hover:bg-sunken border border-border text-text-muted hover:text-danger text-[11px] font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateProductForm({
  categories,
  onSubmit,
  pending,
  onError,
}: {
  categories: { id: string; name: string }[];
  onSubmit: (input: {
    sku: string;
    name: string;
    description: string;
    categoryId: string;
    priceMinorUnits: number;
  }) => Promise<unknown>;
  onError: (message: string) => void;
  pending: boolean;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Prices are entered in major units and sent as minor units (RWF has no
    // minor unit, so the value maps 1:1).
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid price.");
      return;
    }

    try {
      await onSubmit({
        sku,
        name,
        description,
        categoryId,
        priceMinorUnits: Math.round(amount),
      });
      setSku("");
      setName("");
      setDescription("");
      setPrice("");
    } catch (err) {
      // Server-side rejections go to a toast; the inline box is for the
      // client-side checks above, which are about this input.
      onError(
        err instanceof ApiError
          ? (Object.values(err.fieldErrors)[0] ?? err.message)
          : (err as Error).message,
      );
    }
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-text-muted outline-none focus:border-text-accent";

  return (
    <form
      onSubmit={submit}
      className="bg-page border border-border rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-text">New product</h3>
      <p className="text-[11px] text-text-muted">
        Stock is not set here — create the product, then use Adjust stock to bring it in.
      </p>

      {error && (
        <p className="text-[11px] text-danger border border-danger/30 bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className={inputClass} required />
        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="LGC-SKU-001" className={`${inputClass} font-mono`} required />
      </div>

      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} required>
        <option value="">Select a category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input
        type="number"
        min={0}
        step="1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price (RWF)"
        className={`${inputClass} font-mono`}
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description, package contents, logistics notes…"
        className={`${inputClass} min-h-[70px] resize-y`}
        required
      />

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}

function StockAdjustmentForm({
  productName,
  onSubmit,
  onSuccess,
  onError,
  pending,
  onCancel,
}: {
  productName: string;
  onSubmit: (delta: number, reason: string) => Promise<unknown>;
  onSuccess: () => void;
  onError: (message: string) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(delta);
    if (!Number.isInteger(amount) || amount === 0) {
      setError("Enter a non-zero whole number. Use a negative value to remove stock.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required by the API.");
      return;
    }

    try {
      await onSubmit(amount, reason);
      onSuccess();
    } catch (err) {
      // Server-side rejections go to a toast; the inline box is for the
      // client-side checks above, which are about this input.
      onError(
        err instanceof ApiError
          ? err.message.replace("Insufficient stock for product ", "Not enough stock for ")
          : (err as Error).message,
      );
    }
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-text-muted outline-none focus:border-text-accent";

  return (
    <form
      onSubmit={submit}
      className="bg-page border border-accent/40 rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-text">Adjust stock — {productName}</h3>
      <p className="text-[11px] text-text-muted">
        Positive adds stock, negative removes it. Both are recorded as a stock movement.
      </p>

      {error && (
        <p className="text-[11px] text-danger border border-danger/30 bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="number"
          step="1"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="e.g. 25 or -5"
          className={`${inputClass} font-mono`}
          required
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (required)"
          className={inputClass}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending ? "Applying…" : "Apply adjustment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-surface hover:bg-sunken border border-border text-text-muted rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
