/**
 * Types mirroring the API's Swagger entities and Zod DTOs exactly.
 *
 * These deliberately do NOT match the old mock shapes in the previous
 * types.ts. The API uses minor-unit money, `stockQuantity`, an ACTIVE/ARCHIVED
 * status, and nests categories. Field renames here are the point.
 *
 * Source of truth: the entities and DTOs under api/src/modules.
 */

export type Role = "ADMIN" | "SHOP_MANAGER" | "CLIENT" | "DRIVER";

export type ProductStatus = "ACTIVE" | "ARCHIVED";

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED" | "FULFILLED";

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export type VehicleOwnership = "COMPANY" | "INDIVIDUAL";

export type StockMovementType =
  | "RECEIPT"
  | "SALE"
  | "RELEASE"
  | "ADJUSTMENT"
  | "DAMAGED"
  | "WRITE_OFF";

/* ── Catalog ──────────────────────────────────────────────────────────────── */

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  /** Integer in minor units. Format with lib/format.ts, never divide inline. */
  priceMinorUnits: number;
  currency: string;
  stockQuantity: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
};

/** `GET /admin/products` additionally includes the category relation. */
export type AdminProduct = Product & {
  category?: { id: string; name: string; parentId: string | null };
};

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  /** `GET /categories` returns a tree, not a flat list. */
  children?: Category[];
};

export type ProductQuery = {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest";
};

/* ── Cart & Wishlist ──────────────────────────────────────────────────────── */

/** Raw `GET /cart` shape: no product relation. Use the hydrated route instead. */
export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};

/** What `GET /api/cart/hydrated` returns — the BFF joins the product in. */
export type HydratedCartItem = {
  productId: string;
  quantity: number;
  product: Product | null;
  lineTotalMinorUnits: number;
};

export type HydratedCart = {
  items: HydratedCartItem[];
  totalMinorUnits: number;
  currency: string;
};

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  /** Present on `GET /wishlist`, but without images. */
  product?: Product;
};

/* ── Orders ───────────────────────────────────────────────────────────────── */

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceMinorUnitsSnapshot: number;
  quantity: number;
};

export type Order = {
  id: string;
  clientId: string;
  status: OrderStatus;
  totalMinorUnits: number;
  currency: string;
  deliveryId: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

/** Paginated endpoints wrap their payload; bare ones do not. */
export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages?: number };
};

/**
 * Cursor-paginated endpoints. `nextCursor` is null on the last page, and is
 * non-null whenever a full page came back — so it can be non-null on a page
 * that is in fact the last one.
 */
export type CursorPaginated<T> = {
  data: T[];
  meta: { nextCursor: string | null };
};

/* ── Procurement ──────────────────────────────────────────────────────────── */

export type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoodsReceiptItem = {
  id: string;
  goodsReceiptId: string;
  productId: string;
  quantityDelivered: number;
  quantityAccepted: number;
  quantityRejected: number;
  unitCostMinorUnits: number;
  batchNumber: string | null;
  expiryDate: string | null;
  conditionNotes: string | null;
  /** Only on `GET /goods-receipts/:id`. */
  product?: Product;
};

export type GoodsReceipt = {
  id: string;
  supplierId: string;
  deliveredByName: string;
  deliveredByPhone: string | null;
  invoiceNumber: string | null;
  receivedByUserId: string;
  receivedAt: string;
  notes: string | null;
  createdAt: string;
  /**
   * Omitted by `GET /goods-receipts` (procurement.service.ts:64-68) and present
   * only on the by-id route. See docs/API-GAPS.md #10.
   */
  items?: GoodsReceiptItem[];
  supplier?: Supplier;
};

/* ── Deliveries ───────────────────────────────────────────────────────────── */

export type DeliveryParty = { id: string; name: string; email: string };

export type DeliveryVehicle = { id: string; plateNumber: string; type: string };

export type DeliveryStatusHistoryEntry = {
  id: string;
  deliveryId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  changedByUserId: string;
  notes: string | null;
  createdAt: string;
  changedBy?: { id: string; name: string; role: Role };
};

export type Delivery = {
  id: string;
  clientId: string;
  driverId: string | null;
  vehicleId: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  status: DeliveryStatus;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: DeliveryParty;
  driver?: DeliveryParty;
  vehicle?: DeliveryVehicle;
  /** Only on `GET /deliveries/:id`. */
  statusHistory?: DeliveryStatusHistoryEntry[];
};

/* ── Tracking ──────────────────────────────────────────────────────────────── */

/**
 * Live driver state, read from Redis by the tracking service and pushed to the
 * `admins` room over Socket.IO.
 *
 * Positions are optional because a driver can start tracking before the first
 * ping arrives — `trackingStatus` becomes `available` immediately, so the
 * caller must not assume a coordinate exists just because a driver is listed.
 */
export type TrackingStatus = "available" | "on_delivery" | "offline";

export type DriverLiveState = {
  driverId: string;
  name: string | null;
  email: string;
  phone: string | null;
  vehiclePlateNumber: string | null;
  activeDeliveryId: string | null;
  trackingStatus: TrackingStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastAccuracy: number | null;
  lastSeenAt: string | null;
  trackingStartedAt: string | null;
};

/** One point of a delivery's recorded GPS trail, chronologically ordered. */
export type TrailPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: string;
  /** Distance covered on the delivery up to this point, in metres. */
  cumulativeDistanceMeters?: number;
};

/**
 * A driver's position pushed to a delivery's watchers.
 *
 * Emitted by the gateway as `deliveryLocationUpdate` to the `delivery:{id}`
 * room. It is a positional subset of `DriverLiveState`: watchers care about where
 * the driver is, not their profile or fleet.
 */
export type DriverLivePosition = {
  deliveryId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
};

/**
 * Distance and elapsed time for a delivery, from
 * `GET /tracking/deliveries/:id/summary`.
 *
 * Server-authoritative so the driver, an admin, and the ordering client all see
 * identical figures. `elapsedSeconds` keeps counting while `isTerminal` is false.
 */
export type DeliverySummary = {
  deliveryId: string;
  status: string;
  distanceMeters: number;
  distanceKilometers: number;
  /** When the driver took the goods. Null before the PICKED_UP transition. */
  pickedUpAt: string | null;
  /** First terminal transition, or null while the trip is still running. */
  terminalAt: string | null;
  elapsedSeconds: number;
  isTerminal: boolean;
  /** Trail rows recorded for this delivery, before sampling. */
  pointCount: number;
};

/**
 * `GET /tracking/me` returns this envelope instead of a DriverLiveState when
 * the driver has no Redis entry yet, so the shape is deliberately loose.
 */
export type MyTrackingState =
  | (Partial<DriverLiveState> & { trackingStatus: TrackingStatus; message?: string })
  | DriverLiveState;

/** Body for `POST /locations/ping` (driver only, 5 req/s). */
export type LocationPingInput = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  deliveryId?: string;
};

/* ── Vehicles ─────────────────────────────────────────────────────────────── */

export type Vehicle = {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  ownershipType: VehicleOwnership;
  ownedByDriverId: string | null;
  assignedDriverId: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  ownedByDriver?: { id: string; name: string } | null;
  assignedDriver?: { id: string; name: string } | null;
};

/* ── Users ────────────────────────────────────────────────────────────────── */

export type User = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: Role;
  isActive: boolean;
  licenseNumber: string | null;
  isAvailable: boolean | null;
  createdAt: string;
  updatedAt: string;
};

/* ── Auth ─────────────────────────────────────────────────────────────────── */

export type LoginResponse = { accessToken: string; refreshToken: string };

export type RegisterResponse = {
  user: { id: string; email: string; name: string; role: Role };
};
