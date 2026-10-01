"use client";

import { AppFrame } from "@/app/components/AppFrame";
import type { SidebarGroup } from "@/app/components/AppSidebarNav";
import {
  CatalogIcon,
  DeliveryIcon,
  OrdersIcon,
  TrackingIcon,
  UsersIcon,
  VehicleIcon,
} from "@/app/components/sidebar-icons";
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

  const badges: Partial<Record<AdminSection, number>> = {
    deliveries: pendingDeliveries,
    vehicles: activeVehicles,
    tracking: liveDrivers,
  };

  // Same icons and ordering as the warehouse sidebar's ADMINISTRATION group, so
  // the two navs line up when an operator moves between /inventory and /admin.
  const ICONS: Record<AdminSection, React.ElementType> = {
    users: UsersIcon,
    vehicles: VehicleIcon,
    deliveries: DeliveryIcon,
    orders: OrdersIcon,
    tracking: TrackingIcon,
  };

  const sidebarGroups: SidebarGroup[] = [
    {
      title: "ADMINISTRATION",
      items: NAV.map((item) => ({
        key: item.section,
        label: item.label,
        href: item.href,
        icon: ICONS[item.section],
        badge: badges[item.section],
      })),
    },
    {
      title: "MANAGEMENT",
      items: [{ key: "warehouse", label: "Warehouse", href: "/inventory", icon: CatalogIcon }],
    },
  ];

  return (
    <AppFrame
      title="Administration"
      subtitle="Users, fleet, deliveries and orders"
      sidebarGroups={sidebarGroups}
    >
      {section === "users" && <UsersSection />}
      {section === "vehicles" && <VehiclesSection />}
      {section === "deliveries" && <DeliveriesSection />}
      {section === "orders" && <OrdersSection />}
      {section === "tracking" && <LiveTrackingSection />}
    </AppFrame>
  );
}
