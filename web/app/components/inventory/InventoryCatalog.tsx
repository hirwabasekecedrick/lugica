"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "../../lib/store";
import { Product, StockStatus } from "../../lib/types";
import ProductIcon from "./ProductIcon";

interface InventoryCatalogProps {
  onOpenProcurementForProduct?: (productId: string) => void;
}

export default function InventoryCatalog({ onOpenProcurementForProduct }: InventoryCatalogProps) {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | StockStatus>("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Hardware",
    price: "",
    costPrice: "",
    stock: "",
    minStockThreshold: "10",
    image: "package",
    description: "",
  });

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Stock summary counts
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.status === "low-stock").length;
  const outOfStockCount = products.filter((p) => p.status === "out-of-stock").length;

  const openAddModal = () => {
    setFormData({
      name: "",
      sku: `LGC-${Date.now().toString().slice(-4)}`,
      category: "Hardware",
      price: "",
      costPrice: "",
      stock: "",
      minStockThreshold: "10",
      image: "package",
      description: "",
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      minStockThreshold: product.minStockThreshold.toString(),
      image: product.image,
      description: product.description,
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        minStockThreshold: parseInt(formData.minStockThreshold, 10) || 10,
        image: formData.image || "package",
        description: formData.description,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        minStockThreshold: parseInt(formData.minStockThreshold, 10) || 10,
        image: formData.image || "package",
        description: formData.description,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingProductId) {
      deleteProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── METRICS SUMMARY BAR ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">Total Products</p>
          <p className="text-2xl font-bold text-white">{products.length}</p>
          <span className="text-[#6984A9]/70 text-xs">SKUs in catalog</span>
        </div>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">Inventory Units</p>
          <p className="text-2xl font-bold text-[#EEFABD]">{totalStockUnits}</p>
          <span className="text-[#6984A9]/70 text-xs">Available units in warehouse</span>
        </div>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">Low Stock Alerts</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-400" : "text-[#A0D585]"}`}>
            {lowStockCount}
          </p>
          <span className="text-[#6984A9]/70 text-xs">Below safety threshold</span>
        </div>
        <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4">
          <p className="text-[#6984A9] text-xs font-semibold uppercase tracking-wider mb-1">Out of Stock</p>
          <p className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-rose-400" : "text-[#A0D585]"}`}>
            {outOfStockCount}
          </p>
          <span className="text-[#6984A9]/70 text-xs">Requires immediate procurement</span>
        </div>
      </div>

      {/* ── FILTER & ACTION CONTROLS ─────────────────────────── */}
      <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#6984A9]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131e36] border border-[#263B6A] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none transition-all"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Category & Status Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#131e36] border border-[#263B6A] text-[#6984A9] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-[#A0D585] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#131e36] text-white">
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "all" | StockStatus)}
              className="bg-[#131e36] border border-[#263B6A] text-[#6984A9] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-[#A0D585] cursor-pointer"
            >
              <option value="all" className="bg-[#131e36] text-white">All Statuses</option>
              <option value="in-stock" className="bg-[#131e36] text-white">In Stock</option>
              <option value="low-stock" className="bg-[#131e36] text-white">Low Stock</option>
              <option value="out-of-stock" className="bg-[#131e36] text-white">Out of Stock</option>
            </select>
          </div>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-[0.98] whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* ── PRODUCTS DATA TABLE ──────────────────────────────── */}
      <div className="bg-[#0d1525] border border-[#263B6A] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#131e36]/80 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6984A9]">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center text-[#6984A9] mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-white mb-1">No products found</p>
                      <p className="text-xs">Try adjusting your search query or status filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitMargin =
                    p.price > 0 ? (((p.price - p.costPrice) / p.price) * 100).toFixed(0) : "0";

                  return (
                    <tr key={p.id} className="hover:bg-[#131e36]/50 transition-colors group">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#182645] border border-[#263B6A] flex items-center justify-center text-[#A0D585] flex-shrink-0">
                            <ProductIcon name={p.image || p.name} category={p.category} className="w-4 h-4 text-[#A0D585]" />
                          </span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-[#EEFABD] transition-colors">
                              {p.name}
                            </p>
                            <span className="font-mono text-[10px] text-[#6984A9] tracking-wider">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-[#131e36] border border-[#263B6A] text-[#6984A9] font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-[#EEFABD]">${p.price.toFixed(2)}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#6984A9]">
                            <span>Cost: ${p.costPrice.toFixed(2)}</span>
                            <span className="text-[#A0D585] font-semibold">({profitMargin}% mrg)</span>
                          </div>
                        </div>
                      </td>

                      {/* Stock Level Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-white">{p.stock} units</span>
                            <span className="text-[10px] text-[#6984A9]">min {p.minStockThreshold}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#182645] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.status === "in-stock"
                                  ? "bg-[#A0D585]"
                                  : p.status === "low-stock"
                                  ? "bg-amber-400"
                                  : "bg-rose-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (p.stock / Math.max(p.minStockThreshold * 2, 20)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {p.status === "in-stock" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#A0D585]/15 text-[#A0D585] border border-[#A0D585]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A0D585]" />
                            In Stock
                          </span>
                        )}
                        {p.status === "low-stock" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Low Stock
                          </span>
                        )}
                        {p.status === "out-of-stock" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenProcurementForProduct && (
                            <button
                              onClick={() => onOpenProcurementForProduct(p.id)}
                              title="Procure stock batch"
                              className="px-2 py-1 bg-[#131e36] hover:bg-[#263B6A] text-[#A0D585] hover:text-[#EEFABD] border border-[#263B6A] rounded text-[11px] font-medium transition-colors"
                            >
                              + Restock
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit product"
                            className="p-1.5 bg-[#131e36] hover:bg-[#263B6A] text-[#6984A9] hover:text-[#EEFABD] border border-[#263B6A] rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingProductId(p.id)}
                            title="Delete product"
                            className="p-1.5 bg-[#131e36] hover:bg-rose-950/40 text-[#6984A9] hover:text-rose-400 border border-[#263B6A] hover:border-rose-900 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD / EDIT PRODUCT MODAL ─────────────────────────── */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto inventory-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#263B6A] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingProduct ? "Edit Inventory Product" : "Add New Inventory Product"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-[#6984A9] hover:text-white p-1 rounded-lg hover:bg-[#131e36] transition-colors"
                title="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GPS Tracking Module"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Item Icon</label>
                  <select
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                  >
                    <option value="package">Package Box</option>
                    <option value="tracker">GPS Tracker</option>
                    <option value="scanner">Barcode Scanner</option>
                    <option value="label">Shipping Labels</option>
                    <option value="bag">Delivery Gear</option>
                    <option value="printer">Receipt Printer</option>
                    <option value="tape">Security Tape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="LGC-SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Gear">Gear</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Retail Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Supplier Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6984A9] mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6984A9] mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical specifications, package contents, logistics notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#263B6A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] text-[#6984A9] hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-lg transition-colors shadow-md"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────── */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d1525] border border-rose-900/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-white mb-1">Delete Product?</h4>
            <p className="text-xs text-[#6984A9] mb-5">
              Are you sure you want to remove this item from the inventory catalog? This action will remove it from the client shop as well.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] text-[#6984A9] hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
