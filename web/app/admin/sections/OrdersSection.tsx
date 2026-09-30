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
          className="bg-[#131e36] border border-[#263B6A] text-[#EEFABD] text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-[#A0D585] cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="PENDING_PAYMENT">Pending payment</option>
          <option value="PAID">Paid</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <p className="text-[11px] text-[#6984A9]">
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
        <div className="overflow-x-auto bg-[#0d1525] border border-[#263B6A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Placed</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#131e36]/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[10px] text-[#EEFABD] break-all max-w-[120px]">
                    {o.id}
                  </td>
                  <td className="py-3 px-4 text-[#6984A9] whitespace-nowrap">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-white">
                    {(o.items ?? [])
                      .map((i) => `${i.productNameSnapshot} (x${i.quantity})`)
                      .join(", ")}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#A0D585] whitespace-nowrap">
                    {formatMoney(o.totalMinorUnits, o.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        o.status === "EXPIRED" || o.status === "CANCELLED"
                          ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
                          : o.status === "PENDING_PAYMENT"
                            ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                            : "bg-[#A0D585]/15 text-[#A0D585] border-[#A0D585]/30"
                      }`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                    {o.status === "PENDING_PAYMENT" && (
                      <span className="block text-[10px] text-[#6984A9] mt-1">
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
        <p className="text-xs text-[#6984A9]">
          Page {meta.page} · {meta.total} orders
        </p>
      )}
    </div>
  );
}
