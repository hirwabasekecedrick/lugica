"use client";

import { AppFrame } from "@/app/components/AppFrame";
import UsersSection from "./sections/UsersSection";
import VehiclesSection from "./sections/VehiclesSection";
import DeliveriesSection from "./sections/DeliveriesSection";
import OrdersSection from "./sections/OrdersSection";
import LiveTrackingSection from "./sections/LiveTrackingSection";
import { useDeliveries, useVehicles, useActiveDrivers } from "@/lib/api/hooks";
import { isStalePing } from "@/lib/format";

export type AdminSection = "users" | "vehicles" | "deliveries" | "orders" | "tracking";

const NAV: { section: AdminSection; href: string; label: string }[] = [
  { section: "users", href: "/admin/users", label: "Users & Drivers" },
  { section: "vehicles", href: "/admin/vehicles", label: "Vehicles" },
  { section: "deliveries", href: "/admin/deliveries", label: "Deliveries" },
  { section: "orders", href: "/admin/orders", label: "Orders" },
  { section: "tracking", href: "/admin/tracking", label: "Live Tracking" },
];

export default function AdminPage({ section }: { section: AdminSection }) {
  const deliveriesQuery = useDeliveries();
  const vehiclesQuery = useVehicles();
  // Only fetch driver positions for the section that shows them.
  const driversQuery = useActiveDrivers({ enabled: section === "tracking" });

  const pendingDeliveries = (deliveriesQuery.data ?? []).filter(
    (d) => d.status === "PENDING",
  ).length;

  const activeVehicles = (vehiclesQuery.data ?? []).filter((v) => v.status === "ACTIVE").length;

  const liveDrivers = (driversQuery.data ?? []).filter(
    (d) => !isStalePing(d.lastSeenAt),
  ).length;

  const sidebarItems = NAV.map((item) => ({
    href: item.href,
    label: item.label,
    badge:
      item.section === "deliveries"
        ? pendingDeliveries
        : item.section === "vehicles"
          ? activeVehicles
          : item.section === "tracking"
            ? liveDrivers
            : undefined,
  }));

  return (
    <AppFrame
      title="Administration"
      subtitle="Users, fleet, deliveries and orders"
      activeHref={NAV.find((n) => n.section === section)?.href ?? "/admin/users"}
      sidebarItems={[
        ...sidebarItems,
        { href: "/inventory", label: "Warehouse" },
        { href: "/shop", label: "Client Store" },
      ]}
    >
      {section === "users" && <UsersSection />}
      {section === "vehicles" && <VehiclesSection />}
      {section === "deliveries" && <DeliveriesSection />}
      {section === "orders" && <OrdersSection />}
      {section === "tracking" && <LiveTrackingSection />}
    </AppFrame>
  );
}
