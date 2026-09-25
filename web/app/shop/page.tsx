"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import { Product } from "../lib/types";
import ShopNavbar from "../components/shop/ShopNavbar";
import CartDrawer from "../components/shop/CartDrawer";
import WishlistDrawer from "../components/shop/WishlistDrawer";
import ProductIcon from "../components/inventory/ProductIcon";

export default function ShopPage() {
  const { products, cart, wishlist, lastViewedProductIds, addToCart, toggleWishlist, recordProductView } = useStore();

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "stock">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p: Product) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p: Product) => {
        const matchesQuery =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
        return matchesQuery && matchesCat;
      })
      .sort((a: Product, b: Product) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "stock") return b.stock - a.stock;
        return 0; // featured (default)
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Recently viewed products lookup
  const recentProducts = useMemo(() => {
    return lastViewedProductIds
      .map((id: string) => products.find((p: Product) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [lastViewedProductIds, products]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setAddedToast(`Added "${product.name}" to cart`);
    setTimeout(() => setAddedToast(null), 3500);
  };

  const handleOpenQuickView = (product: Product) => {
    recordProductView(product.id);
    setQuickViewProduct(product);
  };

  return (
    <div className="min-h-screen bg-[#0b1324] text-white flex flex-col font-sans selection:bg-[#A0D585] selection:text-[#0d1525]">
      {/* Toast */}
      {addedToast && (
        <div className="fixed top-20 right-5 z-50 bg-[#131e36] border border-[#A0D585] text-[#EEFABD] px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A0D585] animate-ping" />
          <span className="text-xs font-semibold">{addedToast}</span>
        </div>
      )}

      {/* Navbar */}
      <ShopNavbar
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#131e36] via-[#1a2b4c] to-[#0d1525] border border-[#263B6A] p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Equip Your Fleet with <span className="text-[#EEFABD]">Lugica Express</span> Hardware
            </h1>
            <p className="text-xs sm:text-sm text-[#6984A9] leading-relaxed">
              Industrial GPS trackers, rugged 2D barcode sorting scanners, high-tack thermal labels, and waterproof courier backpacks tested across real delivery routes.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#EEFABD] font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Same-Day Hub Dispatch
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Direct Warehouse Stock Sync
              </span>
            </div>
          </div>
        </section>

        {/* Search, Filter & Indexing Toolbar */}
        <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-[#6984A9]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, or specs (e.g. OBD, Bluetooth, Scanner)..."
                className="w-full bg-[#131e36] border border-[#263B6A] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#6984A9] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-[#6984A9] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6984A9] hidden sm:inline whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#131e36] border border-[#263B6A] text-[#EEFABD] text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-[#A0D585] cursor-pointer"
              >
                <option value="featured">Featured Catalog</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock">Highest Availability</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 inventory-scroll">
            <span className="text-xs text-[#6984A9] font-medium mr-1 flex-shrink-0">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#A0D585] text-[#0d1525] shadow-md font-bold"
                    : "bg-[#131e36] text-[#6984A9] hover:text-white hover:bg-[#263B6A]/50 border border-[#263B6A]"
                }`}
              >
                {cat === "all" ? "All Products" : cat}
              </button>
            ))}
            <span className="ml-auto text-xs text-[#6984A9] hidden md:inline">
              Showing <strong className="text-white">{filteredProducts.length}</strong> items
            </span>
          </div>
        </section>

        {/* Product Catalog Grid */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-[#0d1525] border border-[#263B6A] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center mx-auto text-[#6984A9] mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-1">No products match your search</h3>
              <p className="text-xs text-[#6984A9] max-w-sm mx-auto mb-4">
                Try searching for different keywords, resetting filters, or selecting "All Products".
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const isSaved = wishlist.includes(product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockThreshold;

                const imageSrc = product.image?.startsWith("/")
                  ? product.image
                  : `/products/${product.image}.jpg`;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleOpenQuickView(product)}
                    className="bg-[#0d1525] border border-[#263B6A] rounded-2xl overflow-hidden hover:border-[#6984A9] transition-all duration-300 shadow-xl flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Product Image Header with badges */}
                      <div className="relative h-56 bg-[#131e36] overflow-hidden flex items-center justify-center">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />

                        {/* Fallback Icon */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10 text-[#6984A9]">
                          <ProductIcon name={product.image || product.name} className="w-16 h-16 opacity-30" />
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/80 text-white backdrop-blur-sm shadow">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/80 text-white backdrop-blur-sm shadow animate-pulse">
                              Only {product.stock} left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A0D585]/90 text-[#0d1525] backdrop-blur-sm shadow">
                              In Stock ({product.stock})
                            </span>
                          )}
                        </div>

                        {/* Wishlist toggle heart */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            isSaved
                              ? "bg-rose-500 text-white shadow-lg"
                              : "bg-[#0d1525]/70 text-[#6984A9] hover:text-white hover:bg-[#0d1525]"
                          }`}
                          title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                        >
                          <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Info Body */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#6984A9]">
                          <span className="font-semibold uppercase tracking-wider">{product.category}</span>
                          <span className="font-mono text-[10px]">{product.sku}</span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#EEFABD] transition-colors line-clamp-1">
                          {product.name}
                        </h3>

                        <p className="text-xs text-[#6984A9] line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Price and Cart Footer */}
                    <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-[#263B6A]/40 mt-2">
                      <div>
                        <span className="text-[10px] text-[#6984A9] block">Price</span>
                        <span className="text-lg font-black text-[#EEFABD] font-mono">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isOutOfStock}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                          isOutOfStock
                            ? "bg-[#131e36] text-[#6984A9] cursor-not-allowed opacity-50"
                            : "bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] active:scale-95"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recently Viewed Products Strip */}
        {recentProducts.length > 0 && (
          <section className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recently Viewed by You
                </h3>
              </div>
              <span className="text-xs text-[#6984A9]">Session Activity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentProducts.slice(0, 6).map((p: Product) => {
                const imageSrc = p.image?.startsWith("/") ? p.image : `/products/${p.image}.jpg`;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenQuickView(p)}
                    className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl hover:border-[#A0D585] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-24 rounded-lg bg-[#0d1525] overflow-hidden mb-2 relative">
                        <img
                          src={imageSrc}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#EEFABD]">
                        {p.name}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#A0D585] font-mono mt-1">
                      ${p.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Quick View Product Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto inventory-scroll">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Product Photo */}
              <div className="h-64 sm:h-80 rounded-xl bg-[#131e36] border border-[#263B6A] overflow-hidden flex items-center justify-center">
                <img
                  src={quickViewProduct.image?.startsWith("/") ? quickViewProduct.image : `/products/${quickViewProduct.image}.jpg`}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[#A0D585] font-semibold uppercase tracking-wider block mb-1">
                    {quickViewProduct.category} &bull; {quickViewProduct.sku}
                  </span>
                  <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                    {quickViewProduct.name}
                  </h2>
                  <p className="text-2xl font-black text-[#EEFABD] font-mono">
                    ${quickViewProduct.price.toFixed(2)}
                  </p>
                </div>

                <p className="text-xs text-[#6984A9] leading-relaxed">
                  {quickViewProduct.description}
                </p>

                <div className="p-3 rounded-lg bg-[#131e36] border border-[#263B6A] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#6984A9]">Availability:</span>
                    <span className={quickViewProduct.stock > 0 ? "text-[#A0D585] font-semibold" : "text-rose-400 font-semibold"}>
                      {quickViewProduct.stock > 0 ? `${quickViewProduct.stock} units ready in warehouse` : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6984A9]">Courier Transit:</span>
                    <span className="text-white font-medium">Lugica Express Hub 2-Hour Dispatch</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                      setCartOpen(true);
                    }}
                    disabled={quickViewProduct.stock <= 0}
                    className="flex-1 py-3 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {quickViewProduct.stock <= 0 ? "Out of Stock" : "Add to Cart & Checkout"}
                  </button>
                  <button
                    onClick={() => toggleWishlist(quickViewProduct.id)}
                    className="p-3 rounded-xl bg-[#131e36] border border-[#263B6A] text-[#6984A9] hover:text-white"
                  >
                    <svg className="w-5 h-5" fill={wishlist.includes(quickViewProduct.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Wishlist Drawers */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenCart={() => {
          setWishlistOpen(false);
          setCartOpen(true);
        }}
      />
    </div>
  );
}
