"use client";

import React, { useState } from "react";
import InventorySidebar from "../components/inventory/InventorySidebar";
import InventoryTopBar from "../components/inventory/InventoryTopBar";
import InventoryContent from "../components/inventory/InventoryContent";
import InventoryCatalog from "../components/inventory/InventoryCatalog";
import ProcurementWorkflow from "../components/inventory/ProcurementWorkflow";

type Tab = "overview" | "catalog" | "procurement";

/**
 * Warehouse shell.
 *
 * Restores the original sidebar + top bar layout, but with real API data. Tabs
 * are local state rather than routes, matching the original design; the three
 * surfaces share the cached product list.
 */
export default function InventoryPageClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [procureProductId, setProcureProductId] = useState<string | null>(null);
  // Opened by the sidebar's "Add New Product" action.
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-page overflow-hidden text-text font-sans">
      <InventorySidebar
        activeTab={tab}
        onSelectTab={setTab}
        onOpenAddProduct={() => setCreateOpen(true)}
        onOpenProcure={() => setProcureProductId(null)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <InventoryTopBar
          activeTab={tab}
          onSelectTab={setTab}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 inventory-scroll">
          <div className="max-w-7xl mx-auto w-full">
            {tab === "overview" && (
              <InventoryContent
                onNavigateToProcurement={(productId) => {
                  setProcureProductId(productId ?? null);
                  setTab("procurement");
                }}
              />
            )}

            {tab === "catalog" && (
              <InventoryCatalog createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
            )}

            {tab === "procurement" && (
              <ProcurementWorkflow
                preselectedProductId={procureProductId}
                onClearPreselectedProduct={() => setProcureProductId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
