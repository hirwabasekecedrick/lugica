"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppFrame } from "@/app/components/AppFrame";
import { deliveries } from "@/lib/api/deliveries";
import { locations } from "@/lib/api/hooks";
import { usePickupDelivery, useTransitDelivery, useDeliverDelivery } from "@/lib/api/hooks";
import { LoadingState, ErrorState, InlineError } from "@/app/components/ui-states";
import { useToast } from "@/app/components/ToastProvider";
import dynamic from "next/dynamic";

const LiveTrackingMap = dynamic(
  () => import("@/app/components/LiveTrackingMap"),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full min-h-[250px] flex items-center justify-center bg-sunken text-text-muted text-xs font-bold">
        Loading interactive map...
      </div>
    ) 
  }
);

// Location tracking limitation: True always-on background tracking requires a native app 
// or a platform-specific background geolocation capability, which is out of scope for this web build.
// This approach does NOT reliably track location when the phone is locked, the browser is backgrounded, 
// or the OS kills the tab.

export default function DeliveryDetailClient({ id }: { id: string }) {
  const toast = useToast();
  const { data: delivery, isLoading, error, refetch } = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => deliveries.byId(id),
  });

  const pickupMutation = usePickupDelivery();
  const transitMutation = useTransitDelivery();
  const deliverMutation = useDeliverDelivery();

  const [locationPermission, setLocationPermission] = useState<PermissionState | "prompt">("prompt");
  const [trackingActive, setTrackingActive] = useState(false);

  useEffect(() => {
    let watchId: number;
    let intervalId: NodeJS.Timeout;
    
    // Only track if delivery is active (ASSIGNED, PICKED_UP, IN_TRANSIT)
    if (delivery && ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status)) {
      if ("geolocation" in navigator) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          setLocationPermission(result.state);
          result.onchange = () => setLocationPermission(result.state);
        });

        const sendLocationPing = (position: GeolocationPosition) => {
          // Check visibility API so we only ping when page is visible (optional optimization, 
          // but watchPosition fires anyway when active)
          if (document.visibilityState === "visible") {
            locations.ping({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              deliveryId: id,
            }).catch(err => console.error("Location ping failed", err));
          }
        };

        // Start watching position
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setTrackingActive(true);
            sendLocationPing(position);
          },
          (err) => {
            console.error("Geolocation error:", err);
            setTrackingActive(false);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        // Fallback interval to ensure periodic pings if watchPosition doesn't fire often
        intervalId = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => sendLocationPing(position),
            (err) => console.error("Periodic geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
          );
        }, 15000); // 15 seconds config interval
      }
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [delivery, id]);

  const sidebarItems = [
    { href: "/driver?tab=active", label: "Active Journey" },
    { href: "/driver?tab=assigned", label: "Assigned Deliveries" },
    { href: "/driver?tab=history", label: "Journey History" },
  ];

  if (isLoading) {
    return (
      <AppFrame title="Delivery Details" sidebarItems={sidebarItems} activeHref="/driver">
        <LoadingState label="Loading delivery details…" />
      </AppFrame>
    );
  }

  if (error || !delivery) {
    return (
      <AppFrame title="Delivery Details" sidebarItems={sidebarItems} activeHref="/driver">
        <ErrorState error={error || new Error("Delivery not found")} onRetry={() => refetch()} />
      </AppFrame>
    );
  }

  const handleAction = async (action: 'pickup' | 'transit' | 'deliver') => {
    try {
      if (action === 'pickup') {
        await pickupMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as PICKED UP");
      } else if (action === 'transit') {
        await transitMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as IN TRANSIT");
      } else if (action === 'deliver') {
        await deliverMutation.mutateAsync({ id });
        toast.success("Delivery updated", "Status marked as DELIVERED");
      }
    } catch (err) {
      // ApiError extends Error, so the API's own message survives the narrowing.
      const message = err instanceof Error ? err.message : "";
      toast.error("Update failed", message || "Failed to update delivery status");
    }
  };

  const busy = pickupMutation.isPending || transitMutation.isPending || deliverMutation.isPending;

  return (
    <AppFrame
      title={`Delivery ${delivery.id.split("-")[0].toUpperCase()}`}
      subtitle="Delivery Details"
      sidebarItems={sidebarItems}
      activeHref="/driver"
    >
      <div className="max-w-6xl w-full grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <div className="xl:col-span-5 space-y-6">
        
        {locationPermission === "denied" && ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status) && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning flex items-start gap-3">
             <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            <div>
              <strong>Location Access Denied.</strong> You must allow location access in your browser for live tracking to work.
            </div>
          </div>
        )}

        {trackingActive && ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status) && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text-accent flex items-start gap-3">
             <svg className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            <div>
              <strong>Live Tracking Active.</strong> Your location is being shared while this page is open.
            </div>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-sunken mb-4">
             <h3 className="text-sm font-bold text-text">Current Status</h3>
             <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                delivery.status === "DELIVERED"
                  ? "bg-accent/20 text-text-accent"
                  : delivery.status === "PENDING"
                  ? "bg-sunken text-text-muted"
                  : "bg-warning/20 text-warning"
              }`}>
                {delivery.status.replace("_", " ")}
              </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
             {delivery.status === "ASSIGNED" && (
                <button
                  onClick={() => handleAction('pickup')}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Accept & Pick Up
                </button>
             )}
             {delivery.status === "PICKED_UP" && (
                <button
                  onClick={() => handleAction('transit')}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Start Transit
                </button>
             )}
             {delivery.status === "IN_TRANSIT" && (
                <button
                  onClick={() => handleAction('deliver')}
                  disabled={busy}
                  className="flex-1 py-2.5 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
             )}
             {delivery.status === "DELIVERED" && (
                <div className="flex-1 py-2.5 bg-sunken text-text-muted font-bold text-xs rounded-xl text-center">
                  Delivery Complete
                </div>
             )}
          </div>
          
          <div className="mt-4">
            <InlineError message={pickupMutation.error?.message || transitMutation.error?.message || deliverMutation.error?.message || null} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Pickup Location</h3>
             <p className="text-xs text-text">{delivery.pickupAddress}</p>
             <div className="text-[10px] text-text-muted font-mono bg-sunken p-2 rounded">
               Lat: {delivery.pickupLat} <br/> Lng: {delivery.pickupLng}
             </div>
           </div>
           
           <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Dropoff Location</h3>
             <p className="text-xs text-text">{delivery.dropoffAddress}</p>
             <div className="text-[10px] text-text-muted font-mono bg-sunken p-2 rounded">
               Lat: {delivery.dropoffLat} <br/> Lng: {delivery.dropoffLng}
             </div>
           </div>
        </div>
        
        {delivery.client && (
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Client Details</h3>
             <p className="text-xs text-text font-medium">{delivery.client.name}</p>
             <p className="text-xs text-text-muted">{delivery.client.email}</p>
          </div>
        )}
        </div>

        <div className="xl:col-span-7 space-y-6">

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4 overflow-hidden h-full flex flex-col">
          <h3 className="text-sm font-bold text-text border-b border-sunken pb-2">Delivery Map</h3>
          <div className="w-full flex-1 min-h-[500px] rounded-xl overflow-hidden relative bg-sunken border border-border">
            <LiveTrackingMap 
              deliveryId={delivery.id} 
              dropoffLat={delivery.dropoffLat} 
              dropoffLng={delivery.dropoffLng} 
            />
          </div>
        </div>
        </div>

      </div>
    </AppFrame>
  );
}
