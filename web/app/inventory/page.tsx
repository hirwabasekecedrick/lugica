import React from "react";
import InventorySidebar from "../components/inventory/InventorySidebar";
import InventoryTopBar from "../components/inventory/InventoryTopBar";
import InventoryContent from "../components/inventory/InventoryContent";

export const metadata = {
  title: "Lugica | Inventory",
  description: "Inventory management dashboard for Lugica Delivery Express.",
};

export default function InventoryPage() {
  return (
    <div className="flex h-screen w-full bg-[#0e0f18] overflow-hidden text-white">
      {/* Left: Fixed Sidebar */}
      <InventorySidebar />

      {/* Right: Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <InventoryTopBar />

        {/* Scrollable main content */}
        <InventoryContent />
      </div>
    </div>
  );
}
