"use client";

import React, { useState } from "react";
import InventorySidebar from "../components/inventory/InventorySidebar";
import InventoryTopBar from "../components/inventory/InventoryTopBar";
import InventoryContent from "../components/inventory/InventoryContent";
import InventoryCatalog from "../components/inventory/InventoryCatalog";
import ProcurementWorkflow from "../components/inventory/ProcurementWorkflow";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "procurement">("overview");
  const [procureProductId, setProcureProductId] = useState<string | null>(null);

  const handleRestockProduct = (productId: string) => {
    setProcureProductId(productId);
    setActiveTab("procurement");
  };

  return (
    <div className="flex h-screen w-full bg-[#0b1324] overflow-hidden text-white font-sans">
      {/* Left: Fixed Sidebar */}
      <InventorySidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddProduct={() => setActiveTab("catalog")}
        onOpenProcure={() => {
          setProcureProductId(null);
          setActiveTab("procurement");
        }}
      />

      {/* Right: Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with Tabs and Role badge */}
        <InventoryTopBar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Dynamic content view */}
        <div className="flex-1 overflow-y-auto px-7 py-6 inventory-scroll">
          {activeTab === "overview" && (
            <InventoryContent
              onNavigateToCatalog={() => setActiveTab("catalog")}
              onNavigateToProcurement={(productId) => {
                setProcureProductId(productId || null);
                setActiveTab("procurement");
              }}
            />
          )}
          {activeTab === "catalog" && (
            <InventoryCatalog onOpenProcurementForProduct={handleRestockProduct} />
          )}
          {activeTab === "procurement" && (
            <ProcurementWorkflow
              preselectedProductId={procureProductId}
              onClearPreselectedProduct={() => setProcureProductId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
