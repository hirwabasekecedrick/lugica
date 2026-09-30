"use client";

import { useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "@/app/components/ui-states";
import { useAllOrders } from "@/lib/api/hooks";
import { formatCountdown, formatDateTime, formatMoney, orderStatusLabel } from "@/lib/format";
import type { OrderStatus } from "@/lib/api/types";

/**
 * All orders (ADMIN + SHOP_MANAGER).
 *
 * Read-only: the API exposes no route to change an order's status, so there is
 * no confirm-payment action here. See docs/API-GAPS.md #16.
 */
export default function OrdersSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const ordersQuery = useAllOrders(page, status || undefined);

  const orders = ordersQuery.data?.data ?? [];
  const meta = ordersQuery.data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus((e.target.value || "") as OrderStatus | "");
            setPage(1);
          }}
          className="bg-surface border border-border text-text text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-text-accent cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="PENDING_PAYMENT">Pending payment</option>
          <option value="PAID">Paid</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <p className="text-[11px] text-text-muted">
          Read-only — the API has no order status mutation route.
        </p>
      </div>

      {ordersQuery.isLoading ? (
        <LoadingState label="Loading orders…" />
      ) : ordersQuery.isError ? (
        <ErrorState error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="No orders match this filter." />
      ) : (
        <div className="overflow-x-auto bg-page border border-border rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/70 border-b border-border text-text-muted text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Placed</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-sunken transition-colors">
                  <td className="py-3 px-4 font-mono text-[10px] text-text break-all max-w-[120px]">
                    {o.id}
                  </td>
                  <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-text">
                    {(o.items ?? [])
                      .map((i) => `${i.productNameSnapshot} (x${i.quantity})`)
                      .join(", ")}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-text-accent whitespace-nowrap">
                    {formatMoney(o.totalMinorUnits, o.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        o.status === "EXPIRED" || o.status === "CANCELLED"
                          ? "bg-danger/15 text-danger border-danger/30"
                          : o.status === "PENDING_PAYMENT"
                            ? "bg-warning/15 text-warning border-warning/30"
                            : "bg-accent/15 text-text-accent border-accent/30"
                      }`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                    {o.status === "PENDING_PAYMENT" && (
                      <span className="block text-[10px] text-text-muted mt-1">
                        {formatCountdown(o.expiresAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > 0 && (
        <p className="text-xs text-text-muted">
          Page {meta.page} · {meta.total} orders
        </p>
      )}
    </div>
  );
}
