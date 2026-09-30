"use client";

import { useMemo } from "react";
import { LoadingState, ErrorState, EmptyState } from "../ui-states";
import ProductIcon from "./ProductIcon";
import { useAdminProducts, useGoodsReceipts } from "@/lib/api/hooks";
import { LOW_STOCK_THRESHOLD, formatDate, formatMoney, stockState } from "@/lib/format";

/**
 * Warehouse overview.
 *
 * Honest about what the API can answer. Removed from the original:
 *  - "Cost base" — Product has no costPrice field (docs/API-GAPS.md #4)
 *  - "Fulfillment Rate 99.4%" / "Avg dispatch 1.2 hrs" — no API source
 *  - the inbound/outbound bar chart and its 7d/30d/90d toggle, which read from
 *    a hardcoded array and had no endpoint behind them (#15)
 *
 * Stock health uses the global LOW_STOCK_THRESHOLD because the API stores no
 * per-product threshold (#3).
 */
export default function InventoryContent({
  onNavigateToProcurement,
}: {
  onNavigateToProcurement?: (productId?: string) => void;
}) {
  const productsQuery = useAdminProducts();
  const receiptsQuery = useGoodsReceipts();

  const stats = useMemo(() => {
    const products = productsQuery.data ?? [];
    const active = products.filter((p) => p.status === "ACTIVE");
    const totalUnits = active.reduce((sum, p) => sum + p.stockQuantity, 0);
    const retailMinorUnits = active.reduce(
      (sum, p) => sum + p.stockQuantity * p.priceMinorUnits,
      0,
    );
    const needsAttention = active.filter((p) => stockState(p.stockQuantity) !== "in-stock");

    const byCategory: Record<string, { units: number; valueMinor: number; count: number }> = {};
    for (const p of active) {
      const key = p.category?.name ?? "Uncategorised";
      byCategory[key] ??= { units: 0, valueMinor: 0, count: 0 };
      byCategory[key].units += p.stockQuantity;
      byCategory[key].valueMinor += p.stockQuantity * p.priceMinorUnits;
      byCategory[key].count += 1;
    }

    return {
      active,
      totalUnits,
      retailMinorUnits,
      needsAttention,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1].units - a[1].units),
    };
  }, [productsQuery.data]);

  if (productsQuery.isLoading) return <LoadingState label="Loading inventory…" />;
  if (productsQuery.isError) {
    return <ErrorState error={productsQuery.error} onRetry={() => productsQuery.refetch()} />;
  }

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Retail Value"
          value={formatMoney(stats.retailMinorUnits)}
          hint={`${stats.active.length} active SKUs`}
          accent="text-text"
        />
        <KpiCard
          label="Units in Warehouse"
          value={stats.totalUnits.toLocaleString("en-US")}
          hint={`${stats.active.length} active SKUs`}
          accent="text-text"
        />
        <KpiCard
          label="Needs Restock"
          value={String(stats.needsAttention.length)}
          hint={`Below ${LOW_STOCK_THRESHOLD} units or zero`}
          accent={stats.needsAttention.length > 0 ? "text-warning" : "text-text-accent"}
        />
        <KpiCard
          label="Goods Receipts"
          value={String(receiptsQuery.data?.length ?? 0)}
          hint="Recorded receipts"
          accent="text-text-accent"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-page border border-border rounded-xl p-5 shadow-lg">
          <h3 className="text-text text-sm font-bold tracking-tight">Stock by Category</h3>
          <p className="text-xs text-text-muted mt-1 mb-4">
            Units and retail value per category, from live inventory.
          </p>

          {stats.byCategory.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">No active products yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.byCategory.map(([name, data], idx) => {
                const pct = stats.totalUnits > 0 ? (data.units / stats.totalUnits) * 100 : 0;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="font-semibold text-text truncate">{name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-text">{data.units} units</span>
                        <span className="text-text-muted text-[10px] ml-1.5">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted font-mono">
                      {formatMoney(data.valueMinor)} retail · {data.count} SKUs
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-page border border-border rounded-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-text text-sm font-bold tracking-tight">Restock Queue</h3>
          <p className="text-xs text-text-muted mt-1 mb-4">
            Active SKUs at or below the {LOW_STOCK_THRESHOLD}-unit threshold.
          </p>

          {stats.needsAttention.length === 0 ? (
            <p className="text-xs text-text-accent py-8 text-center">
              All active items are above the threshold.
            </p>
          ) : (
            <div className="space-y-2.5 overflow-y-auto">
              {stats.needsAttention.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-page border border-border flex items-center justify-center flex-shrink-0">
                      <ProductIcon name={p.name} className="w-4 h-4 text-text-accent" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text leading-tight truncate">{p.name}</p>
                      <span className="text-[10px] text-text-muted font-mono">{p.sku}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-xs font-bold ${
                        p.stockQuantity === 0 ? "text-danger" : "text-warning"
                      }`}
                    >
                      {p.stockQuantity} units
                    </div>
                    {onNavigateToProcurement && (
                      <button
                        onClick={() => onNavigateToProcurement(p.id)}
                        className="px-2 py-1 mt-1 bg-accent hover:bg-border text-on-accent font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Procure
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-page border border-border rounded-xl p-5 shadow-lg">
        <h3 className="text-text text-sm font-bold tracking-tight">Recent Goods Receipts</h3>
        <p className="text-xs text-text-muted mt-1 mb-4">
          Each receipt lists a supplier but not its line items; open a receipt to see them.
        </p>

        {receiptsQuery.isLoading ? (
          <LoadingState label="Loading receipts…" />
        ) : (receiptsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No goods receipts yet"
            description="Record a receipt to bring stock into the warehouse."
          />
        ) : (
          <div className="space-y-2">
            {(receiptsQuery.data ?? []).slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface/40 border border-border/40"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text truncate">
                    {r.supplier?.name ?? "Supplier"}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Delivered by {r.deliveredByName} · {formatDate(r.receivedAt)}
                    {r.invoiceNumber && ` · ${r.invoiceNumber}`}
                  </p>
                </div>
                <span className="text-[10px] text-text-muted font-mono flex-shrink-0">
                  {r.items ? `${r.items.length} lines` : "items hidden"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="bg-page border border-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
      <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
      <p className={`text-2xl font-black ${accent}`}>{value}</p>
      <span className="text-[11px] text-text-muted">{hint}</span>
    </div>
  );
}
