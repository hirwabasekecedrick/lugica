"use client";

/*
 * next/image is deliberately not used for product photos: the API validates
 * image URLs as arbitrary absolute URLs (create-product.dto.ts:16 uses
 * z.string().url()), so the host is unknowable ahead of time and Next's
 * remotePatterns cannot be enumerated. See docs/API-GAPS.md #17.
 */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo, useDeferredValue } from "react";
import ShopNavbar from "../components/shop/ShopNavbar";
import CartDrawer from "../components/shop/CartDrawer";
import WishlistDrawer from "../components/shop/WishlistDrawer";
import ProductIcon from "../components/inventory/ProductIcon";
import { LoadingState, ErrorState } from "../components/ui-states";
import { useToast } from "../components/ToastProvider";
import {
  useAddToCart,
  useCategories,
  useProductSearch,
  useProducts,
  useRecentlyViewed,
  useToggleWishlist,
  useWishlist,
} from "@/lib/api/hooks";
import { formatMoney, primaryImage, stockState } from "@/lib/format";
import type { Category, Product, ProductQuery } from "@/lib/api/types";

type SortKey = "featured" | "price_asc" | "price_desc";

/**
 * Storefront.
 *
 * Filtering and sorting are server-side: the API supports categoryId, price
 * bounds, inStock and sortBy on `GET /products`. Search goes to
 * `/products/search`, which matches on name + sku + categoryName only
 * (see docs/API-GAPS.md #12) — so the placeholder no longer promises a
 * description match. There is no "highest availability" sort, so the old
 * "stock" option is gone.
 */
export default function ShopPageClient() {
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const toast = useToast();

  // Keep typing responsive while the debounced search runs.
  const deferredSearch = useDeferredValue(searchText);

  const categoriesQuery = useCategories();
  const wishlistQuery = useWishlist();
  const recentQuery = useRecentlyViewed();
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();

  const searching = deferredSearch.trim().length > 0;
  const searchQuery = useProductSearch(deferredSearch);

  const listQuery: ProductQuery = useMemo(
    () => ({
      limit: 100,
      sortBy: sortBy === "featured" ? undefined : sortBy,
      categoryId: categoryId === "all" ? undefined : categoryId,
      inStock: inStockOnly || undefined,
    }),
    [sortBy, categoryId, inStockOnly],
  );

  const productsQuery = useProducts(listQuery);

  const listData = productsQuery.data as unknown as { data?: Product[] } | Product[];
  const productsList = Array.isArray(listData) ? listData : (listData?.data ?? []);
  
  const searchData = searchQuery.data as unknown as { data?: Product[] } | Product[];
  const searchList = Array.isArray(searchData) ? searchData : (searchData?.data ?? []);

  const products = searching ? searchList : productsList;

  // Categories arrive as a tree; flatten it for the chip bar.
  const categories = useMemo(() => {
    const flat: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: Category[] | undefined, depth: number) => {
      for (const node of nodes ?? []) {
        flat.push({ id: node.id, name: node.name, depth });
        walk(node.children, depth + 1);
      }
    };
    walk(categoriesQuery.data, 0);
    return flat;
  }, [categoriesQuery.data]);

  const savedIds = useMemo(
    () => new Set((wishlistQuery.data ?? []).map((i) => i.productId)),
    [wishlistQuery.data],
  );

  async function handleAddToCart(product: Product) {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success("Added to cart", product.name);
    } catch (err) {
      toast.error("Could not add to cart", (err as Error).message);
    }
  }

  function handleToggleWishlist(productId: string, saved: boolean, name: string) {
    toggleWishlist.mutate(
      { productId, saved },
      {
        onSuccess: () =>
          saved
            ? toast.info("Removed from wishlist", name)
            : toast.success("Saved to wishlist", name),
        onError: (err) => toast.error("Wishlist update failed", (err as Error).message),
      },
    );
  }

  const isLoading = searching ? searchQuery.isLoading : productsQuery.isLoading;
  const isError = searching ? searchQuery.isError : productsQuery.isError;
  const error = searching ? searchQuery.error : productsQuery.error;

  return (
    <div className="min-h-screen bg-page text-text flex flex-col font-sans selection:bg-accent selection:text-on-accent">

      <ShopNavbar onOpenCart={() => setCartOpen(true)} onOpenWishlist={() => setWishlistOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-surface via-sunken to-page border border-border p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight leading-tight">
              Equip Your Fleet with <span className="text-text">Lugica Express</span> Hardware
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Industrial GPS trackers, rugged 2D barcode sorting scanners, high-tack thermal labels,
              and waterproof courier backpacks tested across real delivery routes.
            </p>
          </div>
        </section>

        <section className="bg-page border border-border rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, SKU, or category…"
                className="w-full bg-surface border border-border focus:border-text-accent focus:ring-1 focus:ring-text-accent rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text placeholder-text-muted outline-none transition-all"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-accent"
                />
                In stock
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-surface border border-border text-text text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-text-accent cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 inventory-scroll">
            <span className="text-xs text-text-muted font-medium mr-1 flex-shrink-0">Category:</span>
            <button
              onClick={() => setCategoryId("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryId === "all"
                  ? "bg-accent text-on-accent font-bold"
                  : "bg-surface text-text-muted hover:text-text border border-border"
              }`}
            >
              All Products
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                style={{ paddingLeft: c.depth ? 12 + c.depth * 10 : undefined }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryId === c.id
                    ? "bg-accent text-on-accent font-bold"
                    : "bg-surface text-text-muted hover:text-text border border-border"
                }`}
              >
                {c.depth ? `— ${c.name}` : c.name}
              </button>
            ))}
            <span className="ml-auto text-xs text-text-muted hidden md:inline flex-shrink-0">
              Showing <strong className="text-text">{products.length}</strong> items
            </span>
          </div>
        </section>

        <section>
          {isLoading ? (
            <LoadingState label="Loading catalog…" />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => productsQuery.refetch()} />
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-page border border-border rounded-2xl p-6">
              <h3 className="text-base font-bold text-text mb-1">No products match your search</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                Try a different term, or clear the filters.
              </p>
              <button
                onClick={() => {
                  setSearchText("");
                  setCategoryId("all");
                  setInStockOnly(false);
                }}
                className="px-4 py-2 bg-accent hover:bg-border text-on-accent text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => {
                const state = stockState(product.stockQuantity);
                const outOfStock = state === "out-of-stock";
                const image = primaryImage(product);
                const isSaved = savedIds.has(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => setQuickView(product)}
                    className="bg-page border border-border rounded-2xl overflow-hidden hover:border-accent transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="relative h-56 bg-surface overflow-hidden flex items-center justify-center">
                        {image ? (
                          <img src={image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ProductIcon name={product.name} className="w-14 h-14 text-text-muted opacity-40" />
                        )}

                        <div className="absolute top-3 left-3">
                          {state === "out-of-stock" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/80 text-on-status">
                              Out of Stock
                            </span>
                          ) : state === "low-stock" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/80 text-on-status">
                              Only {product.stockQuantity} left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/90 text-on-accent">
                              In Stock ({product.stockQuantity})
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id, isSaved, product.name);
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            isSaved
                              ? "bg-danger text-on-status"
                              : "bg-page/70 text-text-muted hover:text-text"
                          }`}
                          title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                        >
                          <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 000-6.364l-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-5 space-y-2">
                        <span className="font-mono text-[10px] text-text-muted">{product.sku}</span>
                        <h3 className="text-sm sm:text-base font-bold text-text line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-border/40 mt-2">
                      <span className="text-lg font-black text-text font-mono">
                        {formatMoney(product.priceMinorUnits, product.currency)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={outOfStock}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                          outOfStock
                            ? "bg-surface text-text-muted cursor-not-allowed opacity-50"
                            : "bg-accent hover:bg-border text-on-accent active:scale-95"
                        }`}
                      >
                        {outOfStock ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {(recentQuery.data?.length ?? 0) > 0 && (
          <section className="bg-page border border-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                Recently Viewed by You
              </h3>
              <span className="text-xs text-text-muted">Last 20 · clears after 7 days</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {(recentQuery.data ?? []).slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setQuickView(p)}
                  className="p-3 bg-surface/60 border border-border rounded-xl hover:border-accent transition-all cursor-pointer"
                >
                  <div className="w-full h-20 rounded-lg bg-page overflow-hidden mb-2 flex items-center justify-center">
                    <ProductIcon name={p.name} className="w-8 h-8 text-text-muted opacity-40" />
                  </div>
                  <p className="text-xs font-semibold text-text truncate">{p.name}</p>
                  <span className="text-xs font-bold text-text-accent font-mono mt-1 block">
                    {formatMoney(p.priceMinorUnits, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {quickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-page border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto inventory-scroll">
            <button
              onClick={() => setQuickView(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sunken transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="h-64 sm:h-80 rounded-xl bg-surface border border-border overflow-hidden flex items-center justify-center">
                {primaryImage(quickView) ? (
                  <img
                    src={primaryImage(quickView) as string}
                    alt={quickView.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ProductIcon name={quickView.name} className="w-20 h-20 text-text-muted opacity-40" />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-text-muted block mb-1">{quickView.sku}</span>
                  <h2 className="text-xl font-bold text-text mb-2 leading-tight">{quickView.name}</h2>
                  <p className="text-2xl font-black text-text font-mono">
                    {formatMoney(quickView.priceMinorUnits, quickView.currency)}
                  </p>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">{quickView.description}</p>

                <div className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Availability:</span>
                    <span
                      className={
                        quickView.stockQuantity > 0
                          ? "text-text-accent font-semibold"
                          : "text-danger font-semibold"
                      }
                    >
                      {quickView.stockQuantity > 0
                        ? `${quickView.stockQuantity} units in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleAddToCart(quickView);
                      setQuickView(null);
                      setCartOpen(true);
                    }}
                    disabled={quickView.stockQuantity <= 0}
                    className="flex-1 py-3 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg disabled:opacity-40"
                  >
                    {quickView.stockQuantity <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
