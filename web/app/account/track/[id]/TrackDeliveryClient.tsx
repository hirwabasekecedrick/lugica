"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { deliveries } from "@/lib/api/deliveries";
import { LoadingState, ErrorState } from "@/app/components/ui-states";
import dynamic from "next/dynamic";

const LiveTrackingMap = dynamic(
  () => import("@/app/components/LiveTrackingMap"),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-sunken text-text-muted text-sm font-bold">
        Loading live tracking map...
      </div>
    ) 
  }
);

function DeliveryStatusBadge({ status }: { status: string }) {
  const isComplete = status === "DELIVERED";
  const isError = status === "CANCELLED" || status === "FAILED";
  const isActive = status === "IN_TRANSIT" || status === "PICKED_UP" || status === "ASSIGNED";
  
  let className = "bg-surface border-border text-text-muted";
  if (isComplete) className = "bg-status text-on-status border-status/30";
  if (isError) className = "bg-danger text-white border-danger/30";
  if (isActive) className = "bg-accent text-on-accent border-accent/30";

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${className}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function TrackDeliveryClient({ id }: { id: string }) {
  const { data: delivery, isLoading, error, refetch } = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => deliveries.byId(id),
    refetchInterval: 10000, // Refresh status every 10 seconds
  });

  return (
    <div className="min-h-screen bg-page text-text flex flex-col font-sans">
      <header className="bg-surface border-b border-border sticky top-0 z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/account"
              className="w-10 h-10 rounded-full bg-sunken hover:bg-border flex items-center justify-center transition-colors text-text"
            >
              &larr;
            </Link>
            <h1 className="text-xl font-black">Live Tracking</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        {isLoading ? (
          <LoadingState label="Loading delivery details..." />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !delivery ? (
          <ErrorState error={new Error("Delivery not found")} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Status</p>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Destination</p>
                <p className="text-sm font-semibold">{delivery.dropoffAddress}</p>
              </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-surface border border-border rounded-2xl overflow-hidden relative shadow-lg">
              {(delivery.status === "DELIVERED" || delivery.status === "CANCELLED" || delivery.status === "FAILED") ? (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center text-3xl mb-4">
                    {delivery.status === "DELIVERED" ? "🎉" : "❌"}
                  </div>
                  <h2 className="text-2xl font-black mb-2">
                    {delivery.status === "DELIVERED" ? "Delivery Complete" : "Delivery Terminated"}
                  </h2>
                  <p className="text-text-muted max-w-md">
                    {delivery.status === "DELIVERED" 
                      ? "Your package has been successfully delivered. Thank you for shopping with us!" 
                      : "This delivery was cancelled or failed. Please contact support for assistance."}
                  </p>
                </div>
              ) : null}
              
              <LiveTrackingMap 
                deliveryId={delivery.id}
                dropoffLat={delivery.dropoffLat}
                dropoffLng={delivery.dropoffLng}
              />
            </div>

            {delivery.driver && (
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent text-on-accent flex items-center justify-center font-black text-lg">
                  {delivery.driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Your Driver</p>
                  <p className="text-sm font-black">{delivery.driver.name}</p>
                </div>
                {delivery.vehicle && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Vehicle</p>
                    <p className="text-sm font-semibold">{delivery.vehicle.plateNumber}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
