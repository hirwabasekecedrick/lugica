export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type UserRole = "admin" | "shop_manager" | "client";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockThreshold: number;
  status: StockStatus;
  image: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementBatch {
  id: string;
  productId: string;
  productName: string;
  supplierName: string;
  batchNumber: string;
  quantityReceived: number;
  unitCost: number;
  dateReceived: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: "card" | "mobile_money" | "cash_on_delivery";
  status: "pending" | "processing" | "shipped" | "delivered";
  createdAt: string;
}
