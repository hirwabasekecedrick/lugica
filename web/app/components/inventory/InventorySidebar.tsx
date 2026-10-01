"use client";

import React from "react";
import AppSidebarNav, {
  SALES_CHANNEL_LINKS,
  type SidebarGroup,
  type SidebarItem,
} from "@/app/components/AppSidebarNav";
import {
  useAdminProducts,
  useDeliveries,
  useGoodsReceipts,
  useVehicles,
} from "@/lib/api/hooks";
import { useSession } from "@/app/lib/session-context";
import { stockState } from "@/lib/format";
import { hasRole, ADMIN_ROLES } from "@/lib/roles";
import {
  CatalogIcon,
  DashboardIcon,
  DeliveryIcon,
  OrdersIcon,
  ProcurementIcon,
  TrackingIcon,
  UsersIcon,
  VehicleIcon,
} from "@/app/components/sidebar-icons";

export type Tab = "overview" | "catalog" | "procurement";

interface InventorySidebarProps {
  activeTab?: Tab;
  onSelectTab?: (tab: Tab) => void;
  onOpenAddProduct?: () => void;
  onOpenProcure?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Warehouse nav, expressed as groups for the shared AppSidebarNav.
 *
 * This component used to hand-render its own sidebar markup. It now only
 * decides *what* the nav contains; AppSidebarNav owns *how* it looks, which is
 * what makes the warehouse and administration sidebars identical.
 *
 * Differences from the original mock are data-only:
 *  - the role switcher is gone. It called `switchRole` in the fake store, which
 *    would now be a privilege-escalation control, so the role is read-only.
 *  - the hardcoded "Maurice I." / "Manager ID #4092" become the session's
 *    display name and email. The API exposes no name/phone (API-GAPS #1).
 *  - badges are real: low stock from the product list, the procurement count
 *    from goods receipts, and pending deliveries from the delivery list.
 */
export default function InventorySidebar({
  activeTab = "overview",
  onSelectTab,
  onOpenAddProduct,
  onOpenProcure,
  mobileOpen = false,
  onCloseMobile,
}: InventorySidebarProps) {
  const session = useSession();

  const productsQuery = useAdminProducts();
  const receiptsQuery = useGoodsReceipts();
  const deliveriesQuery = useDeliveries();
  const vehiclesQuery = useVehicles();

  // Admin-only links; the API would reject these for other roles anyway.
  const isAdmin = hasRole(session, ADMIN_ROLES);

  const pendingDeliveries = (deliveriesQuery.data ?? []).filter(
    (d) => d.status === "PENDING",
  ).length;
  const activeVehicles = (vehiclesQuery.data ?? []).filter(
    (v) => v.status === "ACTIVE",
  ).length;

  const lowStockCount = (productsQuery.data ?? []).filter(
    (p) => p.status === "ACTIVE" && stockState(p.stockQuantity) !== "in-stock",
  ).length;
  const receiptCount = (receiptsQuery.data ?? []).length;

  const management: SidebarItem[] = [
    { key: "overview", label: "Dashboard", icon: DashboardIcon, onSelect: () => onSelectTab?.("overview") },
    {
      key: "catalog",
      label: "Inventory Catalog",
      icon: CatalogIcon,
      onSelect: () => onSelectTab?.("catalog"),
      badge: lowStockCount,
    },
    {
      key: "procurement",
      label: "Procurement",
      icon: ProcurementIcon,
      onSelect: () => onSelectTab?.("procurement"),
      badge: receiptCount,
      badgeTone: "accent",
    },
  ];

  const administration: SidebarItem[] = [
    { key: "admin-users", label: "Users & Drivers", href: "/admin/users", icon: UsersIcon },
    {
      key: "admin-vehicles",
      label: "Vehicles",
      href: "/admin/vehicles",
      icon: VehicleIcon,
      badge: activeVehicles,
    },
    {
      key: "admin-deliveries",
      label: "Deliveries",
      href: "/admin/deliveries",
      icon: DeliveryIcon,
      badge: pendingDeliveries,
    },
    { key: "admin-orders", label: "Orders", href: "/admin/orders", icon: OrdersIcon },
    { key: "admin-tracking", label: "Live Tracking", href: "/admin/tracking", icon: TrackingIcon },
  ];

  const groups: SidebarGroup[] = [
    { title: "MANAGEMENT", items: management },
    { title: "SALES CHANNELS", items: SALES_CHANNEL_LINKS },
    ...(isAdmin ? [{ title: "ADMINISTRATION", items: administration }] : []),
  ];

  return (
    <AppSidebarNav
      groups={groups}
      selectedKey={activeTab}
      quickActions={[
        {
          key: "add-product",
          label: "Add New Product",
          icon: CatalogIcon,
          onSelect: () => {
            onSelectTab?.("catalog");
            onOpenAddProduct?.();
          },
        },
        {
          key: "procure-batch",
          label: "Procure Stock Batch",
          icon: ProcurementIcon,
          onSelect: () => {
            onSelectTab?.("procurement");
            onOpenProcure?.();
          },
        },
      ]}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}