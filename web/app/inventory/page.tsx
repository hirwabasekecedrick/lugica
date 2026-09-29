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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRestockProduct = (productId: string) => {
    setProcureProductId(productId);
    setActiveTab("procurement");
  };

  return (
    <div className="flex h-screen w-full bg-[#0b1324] overflow-hidden text-white font-sans">
      {/* Sidebar (Desktop fixed + Mobile slide-out drawer) */}
      <InventorySidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddProduct={() => setActiveTab("catalog")}
        onOpenProcure={() => {
          setProcureProductId(null);
          setActiveTab("procurement");
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with mobile hamburger and tabs */}
        <InventoryTopBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic content view */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 inventory-scroll">
          <div className="max-w-7xl mx-auto w-full">
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
    </div>
  );
}
