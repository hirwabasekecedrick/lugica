"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppFrame } from "@/app/components/AppFrame";
import { deliveries } from "@/lib/api/deliveries";
import { qk } from "@/lib/api/hooks";
import { LoadingState, ErrorState, EmptyState } from "@/app/components/ui-states";
import { formatDate } from "@/lib/format";
import type { Delivery } from "@/lib/api/types";

function DeliveryCard({ delivery, isHistory }: { delivery: Delivery; isHistory?: boolean }) {
  return (
    <Link
      href={`/driver/deliveries/${delivery.id}`}
      className="block bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-mono text-text-muted">
          {delivery.id.split("-")[0].toUpperCase()}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          delivery.status === "DELIVERED"
            ? "bg-accent/20 text-text-accent"
            : delivery.status === "PENDING"
            ? "bg-sunken text-text-muted"
            : delivery.status === "CANCELLED" || delivery.status === "FAILED"
            ? "bg-danger/20 text-danger"
            : "bg-warning/20 text-warning"
        }`}>
          {delivery.status.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Pickup</p>
          <p className="text-xs text-text font-medium truncate">{delivery.pickupAddress}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Dropoff</p>
          <p className="text-xs text-text font-medium truncate">{delivery.dropoffAddress}</p>
        </div>
      </div>

      {isHistory && delivery.deliveredAt && (
        <div className="mb-4 text-xs font-bold text-text-accent">
          Completed: {formatDate(delivery.deliveredAt)}
        </div>
      )}

      <div className="text-[10px] text-text-muted flex justify-between items-center pt-3 border-t border-sunken">
        <span>Created {formatDate(delivery.createdAt)}</span>
        <span className="text-text-accent font-semibold flex items-center gap-1">
          {isHistory ? "View Summary" : "View Details"}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function DriverDashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "assigned";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.deliveries(),
    queryFn: deliveries.list,
  });

  const sidebarItems = [
    { href: "/driver?tab=active", label: "Active Journey", icon: VehicleIcon },
    { href: "/driver?tab=assigned", label: "Assigned Deliveries", icon: DeliveryIcon },
    { href: "/driver?tab=history", label: "Journey History", icon: OrdersIcon },
  ];

  let filtered: Delivery[] = [];
  let title = "";
  let emptyMessage = "";

  if (data) {
    if (tab === "assigned") {
      filtered = data.filter((d) => d.status === "ASSIGNED");
      title = "Assigned Deliveries";
      emptyMessage = "You have no new deliveries assigned to you.";
    } else if (tab === "active") {
      filtered = data.filter((d) => d.status === "PICKED_UP" || d.status === "IN_TRANSIT");
      title = "Active Journey";
      emptyMessage = "You don't have any ongoing journeys right now.";
    } else {
      filtered = data.filter((d) => ["DELIVERED", "CANCELLED", "FAILED"].includes(d.status));
      title = "Journey History";
      emptyMessage = "You haven't completed any journeys yet.";
    }
  }

  return (
    <AppFrame
      title="Driver Dashboard"
      subtitle="Manage your assigned deliveries"
      sidebarItems={sidebarItems}
      activeHref={`/driver?tab=${tab}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          {data && (
            <span className="bg-sunken px-2 py-1 rounded text-xs font-mono font-bold text-text-muted">
              {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'}
            </span>
          )}
        </div>

        {isLoading ? (
          <LoadingState label="Loading deliveries…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No deliveries" description={emptyMessage} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} isHistory={tab === "history"} />
            ))}
          </div>
        )}
      </div>
    </AppFrame>
  );
}

export default function DriverPageClient() {
  return (
    <Suspense fallback={<LoadingState label="Loading dashboard..." />}>
      <DriverDashboardContent />
    </Suspense>
  );
}

/* ─── Inline SVG Icons ──────────────────────────────────────── */

function VehicleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 12V7a1 1 0 011-1h9a1 1 0 011 1v5" strokeLinecap="round" />
      <path d="M2 12h16v3a1 1 0 01-1 1h-1.5" strokeLinecap="round" />
      <path d="M4 16H2.5A1.5 1.5 0 011 14.5V12" strokeLinecap="round" />
      <circle cx="6" cy="14" r="1.75" />
      <circle cx="14" cy="14" r="1.75" />
    </svg>
  );
}

function DeliveryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M10 17s5-4.6 5-8a5 5 0 10-10 0c0 3.4 5 8 5 8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="9" r="1.75" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 2.5h9L17 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-13a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 2.5V6h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10h7M6.5 13h5" strokeLinecap="round" />
    </svg>
  );
}
