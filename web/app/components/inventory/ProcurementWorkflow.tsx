"use client";

import React, { useState } from "react";
import { useStore } from "../../lib/store";

interface ProcurementWorkflowProps {
  preselectedProductId?: string | null;
  onClearPreselectedProduct?: () => void;
}

export default function ProcurementWorkflow({
  preselectedProductId,
  onClearPreselectedProduct,
}: ProcurementWorkflowProps) {
  const { products, procurementBatches, procureStock } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(Boolean(preselectedProductId));
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || (products[0]?.id ?? "")
  );
  const [supplierName, setSupplierName] = useState("");
  const [batchNumber, setBatchNumber] = useState(
    `BN-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [quantityReceived, setQuantityReceived] = useState<string>("50");
  const [unitCost, setUnitCost] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-fill cost price when product changes
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && !unitCost) {
      setUnitCost(prod.costPrice.toString());
    }
  };

  const openProcureModal = () => {
    setBatchNumber(`BN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    const initialProd = selectedProduct || products[0];
    if (initialProd) {
      setSelectedProductId(initialProd.id);
      setUnitCost(initialProd.costPrice.toString());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClearPreselectedProduct) {
      onClearPreselectedProduct();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(quantityReceived, 10) || 0;
    const cost = parseFloat(unitCost) || selectedProduct.costPrice;

    if (qty <= 0) return;

    procureStock({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      supplierName: supplierName || "Verified Logistics Partner",
      batchNumber: batchNumber || `BN-${Date.now()}`,
      quantityReceived: qty,
      unitCost: cost,
      notes,
    });

    setToastMessage(
      `Successfully received ${qty} units of ${selectedProduct.name}. Inventory stock updated!`
    );
    setTimeout(() => setToastMessage(null), 4000);

    handleCloseModal();
  };

  // Metrics
  const totalBatches = procurementBatches.length;
  const totalUnitsProcured = procurementBatches.reduce(
    (sum, b) => sum + b.quantityReceived,
    0
  );
  const totalProcurementSpend = procurementBatches.reduce(
    (sum, b) => sum + b.quantityReceived * b.unitCost,
    0
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-[#131e36] border border-[#A0D585] text-[#EEFABD] px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A0D585] animate-ping" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── PROCUREMENT METRICS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">
            Total Batches Received
          </p>
          <p className="text-2xl font-bold text-white">{totalBatches}</p>
          <span className="text-[#6984A9]/70 text-xs">Logged procurement shipments</span>
        </div>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">
            Total Units Added to Stock
          </p>
          <p className="text-2xl font-bold text-[#A0D585]">+{totalUnitsProcured}</p>
          <span className="text-[#6984A9]/70 text-xs">Incoming inventory restocks</span>
        </div>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">
            Procurement Spend
          </p>
          <p className="text-2xl font-bold text-[#EEFABD]">
            ${totalProcurementSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[#6984A9]/70 text-xs">Cumulative supplier investment</span>
        </div>
      </div>

      {/* ── WORKFLOW BANNER & TRIGGER ────────────────────────── */}
      <div className="bg-gradient-to-r from-[#131e36] via-[#1a2b4c] to-[#131e36] border border-[#263B6A] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A0D585]/20 text-[#A0D585] border border-[#A0D585]/30 uppercase tracking-wide">
              Shop Manager Action
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Procurement &amp; Inbound Stock Receiving
          </h3>
          <p className="text-xs text-[#6984A9] max-w-xl">
            Log supplier delivery batches to immediately replenish warehouse stock levels, update SKU cost margins, and trigger restock flags across client storefronts.
          </p>
        </div>
        <button
          onClick={openProcureModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-lg transition-colors cursor-pointer flex-shrink-0 shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Record Inbound Batch
        </button>
      </div>

      {/* ── HISTORICAL BATCHES AUDIT LOG ─────────────────────── */}
      <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#263B6A] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Procurement Audit History
            </h4>
            <p className="text-[11px] text-[#6984A9]">Verified batches accepted into inventory</p>
          </div>
          <span className="text-[11px] text-[#6984A9]">{procurementBatches.length} batches logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Qty Received</th>
                <th className="py-3 px-4">Cost Breakdown</th>
                <th className="py-3 px-4">Date Logged</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50">
              {procurementBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6984A9]">
                    No procurement batches recorded yet. Click &quot;Record Inbound Batch&quot; to restock items.
                  </td>
                </tr>
              ) : (
                procurementBatches.map((batch) => {
                  const totalBatchCost = batch.quantityReceived * batch.unitCost;
                  const dateStr = new Date(batch.dateReceived).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={batch.id} className="hover:bg-[#131e36]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#EEFABD]">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {batch.productName}
                      </td>
                      <td className="py-3 px-4 text-[#6984A9]">
                        {batch.supplierName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#A0D585]">+{batch.quantityReceived}</span>{" "}
                        <span className="text-[#6984A9] text-[10px]">units</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-white font-semibold">${totalBatchCost.toFixed(2)}</span>
                          <span className="text-[#6984A9] text-[10px] ml-1">
                            (${batch.unitCost.toFixed(2)}/ea)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#6984A9]">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30">
                          <svg className="w-3 h-3 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Restocked
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RECORD PROCUREMENT MODAL ─────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto inventory-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#263B6A] mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Procure Stock to Inventory</h3>
                <p className="text-xs text-[#6984A9]">Receive delivery shipment and update SKU stock</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-[#6984A9] hover:text-white p-1 rounded-lg hover:bg-[#131e36] transition-colors"
                title="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product selection */}
              <div>
                <label className="block text-xs font-medium text-[#6984A9] mb-1">
                  Target Product to Restock *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#131e36] text-white">
                      {p.name} ({p.sku}) — Current Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch number & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">
                    Batch / Manifest Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Logistics Suppliers"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
              </div>

              {/* Qty & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">
                    Quantity Received (units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(e.target.value)}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs font-bold text-[#A0D585] outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">
                    Unit Cost Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                  />
                </div>
              </div>

              {/* Live stock preview calculation */}
              {selectedProduct && (
                <div className="bg-[#131e36] border border-[#263B6A] rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6984A9]">Current Stock: </span>
                    <span className="font-bold text-white">{selectedProduct.stock} units</span>
                  </div>
                  <span className="text-[#6984A9]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-[#6984A9]">After Receiving: </span>
                    <span className="font-bold text-[#A0D585]">
                      {selectedProduct.stock + (parseInt(quantityReceived, 10) || 0)} units
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#6984A9] mb-1">
                  Procurement Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inspected shipment at dock 4, all units intact and tested."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#263B6A]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] text-[#6984A9] hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-lg transition-colors shadow-md"
                >
                  Confirm &amp; Restock Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
