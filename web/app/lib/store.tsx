"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, ProcurementBatch, CartItem, Order, UserRole, StockStatus } from "./types";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Lugica GPS OBD-II Vehicle Tracker",
    sku: "LGC-GPS-001",
    category: "Hardware",
    price: 89.99,
    costPrice: 48.0,
    stock: 45,
    minStockThreshold: 10,
    status: "in-stock",
    image: "🛰️",
    description: "Real-time 4G LTE vehicle tracking plug-and-play OBD device with live telemetry and tamper alerts.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-20T14:30:00Z",
  },
  {
    id: "prod-2",
    name: "Rugged Handheld Barcode Scanner",
    sku: "LGC-SCN-002",
    category: "Hardware",
    price: 149.0,
    costPrice: 75.0,
    stock: 8,
    minStockThreshold: 10,
    status: "low-stock",
    image: "🔫",
    description: "Bluetooth 2D QR & barcode scanner with drop resistance up to 2m, designed for warehouse parcel sorting.",
    createdAt: "2026-09-02T11:00:00Z",
    updatedAt: "2026-09-22T09:15:00Z",
  },
  {
    id: "prod-3",
    name: "Thermal Shipping Label Rolls (Pack of 12)",
    sku: "LGC-LBL-003",
    category: "Supplies",
    price: 34.5,
    costPrice: 16.0,
    stock: 120,
    minStockThreshold: 25,
    status: "in-stock",
    image: "🏷️",
    description: "4x6 direct thermal commercial shipping labels, waterproof and smudge-proof for high volume parcel routing.",
    createdAt: "2026-09-03T12:00:00Z",
    updatedAt: "2026-09-18T16:45:00Z",
  },
  {
    id: "prod-4",
    name: "Insulated Courier Delivery Backpack",
    sku: "LGC-BAG-004",
    category: "Gear",
    price: 64.99,
    costPrice: 31.0,
    stock: 0,
    minStockThreshold: 5,
    status: "out-of-stock",
    image: "🎒",
    description: "Waterproof expandable 48L delivery backpack with thermal insulation and high-visibility reflective strips.",
    createdAt: "2026-09-04T13:00:00Z",
    updatedAt: "2026-09-24T08:00:00Z",
  },
  {
    id: "prod-5",
    name: "Bluetooth Wireless Receipt Printer",
    sku: "LGC-PRT-005",
    category: "Hardware",
    price: 119.99,
    costPrice: 62.0,
    stock: 14,
    minStockThreshold: 8,
    status: "in-stock",
    image: "🖨️",
    description: "Compact 58mm mobile ESC/POS printer for printing customer parcel receipts directly from driver handsets.",
    createdAt: "2026-09-05T14:00:00Z",
    updatedAt: "2026-09-21T10:20:00Z",
  },
  {
    id: "prod-6",
    name: "Tamper-Evident Security Seal Tape (6 Rolls)",
    sku: "LGC-TAP-006",
    category: "Supplies",
    price: 24.99,
    costPrice: 11.5,
    stock: 6,
    minStockThreshold: 15,
    status: "low-stock",
    image: "📦",
    description: "High-security void adhesive tape leaving explicit warning marks if high-value courier parcel is opened.",
    createdAt: "2026-09-06T15:00:00Z",
    updatedAt: "2026-09-23T11:40:00Z",
  },
];

const INITIAL_BATCHES: ProcurementBatch[] = [
  {
    id: "batch-101",
    productId: "prod-1",
    productName: "Lugica GPS OBD-II Vehicle Tracker",
    supplierName: "Shenzhen Telematics Ltd",
    batchNumber: "BN-2026-0881",
    quantityReceived: 50,
    unitCost: 48.0,
    dateReceived: "2026-09-15T09:30:00Z",
    notes: "Batch passed QA calibration inspection.",
  },
  {
    id: "batch-102",
    productId: "prod-3",
    productName: "Thermal Shipping Label Rolls (Pack of 12)",
    supplierName: "Apex Paper Packaging Co.",
    batchNumber: "BN-2026-0943",
    quantityReceived: 100,
    unitCost: 16.0,
    dateReceived: "2026-09-18T14:10:00Z",
    notes: "Restocked for upcoming Q4 parcel surge.",
  },
];

interface StoreContextType {
  // Role
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;

  // Inventory CRUD
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt" | "status">) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) => void;
  deleteProduct: (id: string) => void;

  // Procurement
  procurementBatches: ProcurementBatch[];
  procureStock: (batch: Omit<ProcurementBatch, "id" | "dateReceived">) => void;

  // Client shopping (Storefront, Cart, Wishlist, Last Activity)
  cart: CartItem[];
  wishlist: string[];
  lastViewedProductIds: string[];
  lastPurchasedProductIds: string[];
  orders: Order[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  recordProductView: (productId: string) => void;
  checkout: (orderDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: "card" | "mobile_money" | "cash_on_delivery";
  }) => Order;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("shop_manager");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [procurementBatches, setProcurementBatches] = useState<ProcurementBatch[]>(INITIAL_BATCHES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [lastViewedProductIds, setLastViewedProductIds] = useState<string[]>([]);
  const [lastPurchasedProductIds, setLastPurchasedProductIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load from localStorage after mount
  useEffect(() => {
    setIsClient(true);
    try {
      const storedRole = localStorage.getItem("lugica_role");
      if (storedRole) setCurrentRole(storedRole as UserRole);

      const storedProds = localStorage.getItem("lugica_products");
      if (storedProds) setProducts(JSON.parse(storedProds));

      const storedBatches = localStorage.getItem("lugica_batches");
      if (storedBatches) setProcurementBatches(JSON.parse(storedBatches));

      const storedCart = localStorage.getItem("lugica_cart");
      if (storedCart) setCart(JSON.parse(storedCart));

      const storedWishlist = localStorage.getItem("lugica_wishlist");
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

      const storedViewed = localStorage.getItem("lugica_viewed");
      if (storedViewed) setLastViewedProductIds(JSON.parse(storedViewed));

      const storedPurchased = localStorage.getItem("lugica_purchased");
      if (storedPurchased) setLastPurchasedProductIds(JSON.parse(storedPurchased));

      const storedOrders = localStorage.getItem("lugica_orders");
      if (storedOrders) setOrders(JSON.parse(storedOrders));
    } catch {
      // fallback to initial state
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem("lugica_role", currentRole);
      localStorage.setItem("lugica_products", JSON.stringify(products));
      localStorage.setItem("lugica_batches", JSON.stringify(procurementBatches));
      localStorage.setItem("lugica_cart", JSON.stringify(cart));
      localStorage.setItem("lugica_wishlist", JSON.stringify(wishlist));
      localStorage.setItem("lugica_viewed", JSON.stringify(lastViewedProductIds));
      localStorage.setItem("lugica_purchased", JSON.stringify(lastPurchasedProductIds));
      localStorage.setItem("lugica_orders", JSON.stringify(orders));
    } catch {
      // storage quota or private browsing fallback
    }
  }, [
    isClient,
    currentRole,
    products,
    procurementBatches,
    cart,
    wishlist,
    lastViewedProductIds,
    lastPurchasedProductIds,
    orders,
  ]);

  const calculateStatus = (stock: number, minThreshold: number): StockStatus => {
    if (stock <= 0) return "out-of-stock";
    if (stock <= minThreshold) return "low-stock";
    return "in-stock";
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const addProduct = (item: Omit<Product, "id" | "createdAt" | "updatedAt" | "status">) => {
    const status = calculateStatus(item.stock, item.minStockThreshold);
    const newProduct: Product = {
      ...item,
      id: `prod-${Date.now()}`,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== id) return prod;
        const newStock = updates.stock !== undefined ? updates.stock : prod.stock;
        const newMinThreshold =
          updates.minStockThreshold !== undefined ? updates.minStockThreshold : prod.minStockThreshold;
        const status = calculateStatus(newStock, newMinThreshold);

        return {
          ...prod,
          ...updates,
          status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const procureStock = (batchData: Omit<ProcurementBatch, "id" | "dateReceived">) => {
    const newBatch: ProcurementBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      dateReceived: new Date().toISOString(),
    };

    setProcurementBatches((prev) => [newBatch, ...prev]);

    // Increase product stock and recalculate status
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== batchData.productId) return prod;
        const updatedStock = prod.stock + batchData.quantityReceived;
        const status = calculateStatus(updatedStock, prod.minStockThreshold);
        return {
          ...prod,
          stock: updatedStock,
          costPrice: batchData.unitCost,
          status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const recordProductView = (productId: string) => {
    setLastViewedProductIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10);
    });
  };

  const checkout = (orderDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: "card" | "mobile_money" | "cash_on_delivery";
  }) => {
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      totalAmount,
      customerName: orderDetails.customerName,
      customerEmail: orderDetails.customerEmail,
      customerPhone: orderDetails.customerPhone,
      shippingAddress: orderDetails.shippingAddress,
      paymentMethod: orderDetails.paymentMethod,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    // Deduct stock from products
    cart.forEach((cartItem) => {
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id !== cartItem.product.id) return prod;
          const updatedStock = Math.max(0, prod.stock - cartItem.quantity);
          const status = calculateStatus(updatedStock, prod.minStockThreshold);
          return {
            ...prod,
            stock: updatedStock,
            status,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    });

    // Record last purchased products
    const purchasedIds = cart.map((c) => c.product.id);
    setLastPurchasedProductIds((prev) => {
      const combined = Array.from(new Set([...purchasedIds, ...prev]));
      return combined.slice(0, 10);
    });

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  return (
    <StoreContext.Provider
      value={{
        currentRole,
        switchRole,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        procurementBatches,
        procureStock,
        cart,
        wishlist,
        lastViewedProductIds,
        lastPurchasedProductIds,
        orders,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        recordProductView,
        checkout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
