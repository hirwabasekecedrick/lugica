"use client";

import { AppFrame } from "@/app/components/AppFrame";
import UsersSection from "./sections/UsersSection";
import VehiclesSection from "./sections/VehiclesSection";
import DeliveriesSection from "./sections/DeliveriesSection";
import OrdersSection from "./sections/OrdersSection";
import { useDeliveries, useVehicles } from "@/lib/api/hooks";

export type AdminSection = "users" | "vehicles" | "deliveries" | "orders";

const NAV: { section: AdminSection; href: string; label: string }[] = [
  { section: "users", href: "/admin/users", label: "Users & Drivers" },
  { section: "vehicles", href: "/admin/vehicles", label: "Vehicles" },
  { section: "deliveries", href: "/admin/deliveries", label: "Deliveries" },
  { section: "orders", href: "/admin/orders", label: "Orders" },
];

export default function AdminPage({ section }: { section: AdminSection }) {
  const deliveriesQuery = useDeliveries();
  const vehiclesQuery = useVehicles();

  const pendingDeliveries = (deliveriesQuery.data ?? []).filter(
    (d) => d.status === "PENDING",
  ).length;

  const activeVehicles = (vehiclesQuery.data ?? []).filter((v) => v.status === "ACTIVE").length;

  const sidebarItems = NAV.map((item) => ({
    href: item.href,
    label: item.label,
    badge:
      item.section === "deliveries"
        ? pendingDeliveries
        : item.section === "vehicles"
          ? activeVehicles
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
    </AppFrame>
  );
}
