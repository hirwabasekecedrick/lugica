"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

// Fix default icon paths in Next.js
// @ts-expect-error - _getIconUrl is an internal Leaflet method
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for the delivery truck/driver
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for dropoff
const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface TrailPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  recordedAt: string;
}

// Helper component to adjust bounds to fit both markers and trail
function MapBounds({ trail, dropoff }: { trail: TrailPoint[], dropoff: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([dropoff]);
    if (trail.length > 0) {
      trail.forEach(p => bounds.extend([p.latitude, p.longitude]));
    }
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, trail, dropoff]);
  return null;
}

export default function LiveTrackingMap({ 
  deliveryId, 
  dropoffLat, 
  dropoffLng 
}: { 
  deliveryId: string;
  dropoffLat: number;
  dropoffLng: number;
}) {
  const { data: trail = [] } = useQuery({
    queryKey: ['delivery-trail', deliveryId],
    queryFn: () => api.get<TrailPoint[]>(`/tracking/deliveries/${deliveryId}/trail`),
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  });

  const dropoffPos: [number, number] = [dropoffLat, dropoffLng];
  const driverPos = trail.length > 0 
    ? [trail[trail.length - 1].latitude, trail[trail.length - 1].longitude] as [number, number]
    : null;

  // Use OSRM (which uses Dijkstra's/Contraction Hierarchies under the hood) 
  // to find the absolute shortest path from the driver's CURRENT location to the destination.
  const { data: routeCoords } = useQuery({
    queryKey: ['osrm-route', driverPos, dropoffPos],
    queryFn: async () => {
      if (!driverPos) return null;
      
      // We only route from the driver's CURRENT location to the dropoff.
      // We do not force the route through historical trail points, which avoids weird zigzagging.
      const coords = `${driverPos[1]},${driverPos[0]};${dropoffLng},${dropoffLat}`;
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        // GeoJSON returns [lon, lat], Polyline needs [lat, lon]
        return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
      }
      return null;
    },
    enabled: !!driverPos,
    staleTime: Infinity,
  });

  // Render the projected shortest path using OSRM data, fallback to straight line if API fails
  // We prepend the exact driver pin and append the exact dropoff pin to ensure the line touches the markers,
  // since OSRM snaps to the nearest road which might be slightly offset from the physical pins.
  const projectedPath = routeCoords && driverPos 
    ? [driverPos, ...routeCoords, dropoffPos]
    : (driverPos ? [driverPos, dropoffPos] : []);
  
  // Past historical trail of where the driver actually drove
  const historicalPath = trail.map(p => [p.latitude, p.longitude] as [number, number]);

  return (
    <div className="w-full h-[500px] relative z-0">
      <MapContainer 
        center={dropoffPos} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={dropoffPos} icon={dropoffIcon}>
          <Popup>Drop-off Location</Popup>
        </Marker>

        {driverPos && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>Current Driver Location</Popup>
          </Marker>
        )}

        {historicalPath.length > 1 && (
          <Polyline positions={historicalPath} color="gray" weight={4} opacity={0.5} dashArray="5, 10" />
        )}

        {projectedPath.length > 1 && (
          <Polyline positions={projectedPath} color="blue" weight={5} opacity={0.7} />
        )}

        <MapBounds trail={trail} dropoff={dropoffPos} />
      </MapContainer>
    </div>
  );
}
