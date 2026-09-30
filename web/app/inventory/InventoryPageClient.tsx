"use client";

import React, { useState } from "react";
import { AppFrame } from "../components/AppFrame";
import InventoryContent from "../components/inventory/InventoryContent";
import InventoryCatalog from "../components/inventory/InventoryCatalog";
import ProcurementWorkflow from "../components/inventory/ProcurementWorkflow";
import { useAdminProducts } from "@/lib/api/hooks";
import { stockState } from "@/lib/format";

type Tab = "overview" | "catalog" | "procurement";

/**
 * Warehouse shell. Tabs are local state rather than routes, matching the
 * original design; the three surfaces all read the same cached product list.
 */
export default function InventoryPageClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [procureProductId, setProcureProductId] = useState<string | null>(null);
  const productsQuery = useAdminProducts();

  const lowStockCount = (productsQuery.data ?? []).filter(
    (p) => p.status === "ACTIVE" && stockState(p.stockQuantity) !== "in-stock",
  ).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Dashboard" },
    { id: "catalog", label: "Catalog" },
    { id: "procurement", label: "Procurement" },
  ];

  return (
    <AppFrame
      title="Warehouse"
      subtitle="Inventory, catalog and procurement"
      activeHref="/inventory"
      sidebarItems={[
        { href: "/inventory", label: "Warehouse" },
        { href: "/shop", label: "Client Store" },
        { href: "/account", label: "My Account" },
        { href: "/admin/users", label: "Admin Section" },
      ]}
      actions={
        <div className="flex items-center gap-1 bg-[#131e36] border border-[#263B6A] rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                tab === t.id ? "bg-[#263B6A] text-[#EEFABD]" : "text-[#6984A9] hover:text-white"
              }`}
            >
              {t.label}
              {t.id === "catalog" && lowStockCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>
          ))}
        </div>
      }
    >
      {tab === "overview" && (
        <InventoryContent
          onNavigateToProcurement={(productId) => {
            setProcureProductId(productId ?? null);
            setTab("procurement");
          }}
        />
      )}

      {tab === "catalog" && <InventoryCatalog />}

      {tab === "procurement" && (
        <ProcurementWorkflow
          preselectedProductId={procureProductId}
          onClearPreselectedProduct={() => setProcureProductId(null)}
        />
      )}
    </AppFrame>
  );
}
