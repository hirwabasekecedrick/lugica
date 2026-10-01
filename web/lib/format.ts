import type { Product } from "./api/types";

/**
 * Currencies with no minor unit. The API stores every price as
 * `priceMinorUnits` (an Int), so these must render without dividing.
 * Seed data uses RWF, which is a zero-decimal currency.
 */
const ZERO_DECIMAL = new Set(["RWF", "JPY", "KRW", "VND", "CLP", "ISK", "XOF", "XAF"]);

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RWF: "RWF",
};

function symbolFor(currency: string): string {
  return SYMBOLS[currency] ?? currency;
}

/**
 * Format an integer minor-unit amount for display.
 *
 *   formatMoney(100000, "RWF") -> "RWF 100,000"
 *   formatMoney(1099,   "USD") -> "$10.99"
 *
 * Never divide by 100 inline in a component — that silently misprices any
 * zero-decimal currency.
 */
export function formatMoney(minorUnits: number, currency = "RWF"): string {
  const safe = Number.isFinite(minorUnits) ? minorUnits : 0;
  const code = currency.toUpperCase();
  const symbol = symbolFor(code);

  if (ZERO_DECIMAL.has(code)) {
    return `${symbol} ${safe.toLocaleString("en-US")}`;
  }

  return `${symbol}${(safe / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "in 4 min" / "expired" for the PENDING_PAYMENT countdown. */
export function formatCountdown(iso: string | null | undefined): string {
  if (!iso) return "—";

  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "expired";

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "under a minute left";
  if (minutes < 60) return `${minutes} min left`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m left`;
}

/**
 * Stock status derived locally. The API has no stock-status field and no
 * per-product threshold, so this uses a single global constant.
 * See docs/API-GAPS.md #3.
 */
export type StockState = "out-of-stock" | "low-stock" | "in-stock";

export const LOW_STOCK_THRESHOLD = 10;

export function stockState(
  stockQuantity: number,
  threshold: number = LOW_STOCK_THRESHOLD,
): StockState {
  if (stockQuantity <= 0) return "out-of-stock";
  if (stockQuantity <= threshold) return "low-stock";
  return "in-stock";
}

export function stockStateOf(
  product: Pick<Product, "stockQuantity">,
  threshold: number = LOW_STOCK_THRESHOLD,
): StockState {
  return stockState(product.stockQuantity, threshold);
}

/** The first image URL, if any. Seed data creates none, so callers need a fallback. */
export function primaryImage(product: Pick<Product, "images"> | null | undefined): string | null {
  if (!product?.images?.length) return null;
  const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted[0]?.url ?? null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SHOP_MANAGER: "Shop Manager",
  CLIENT: "Client",
  DRIVER: "Driver",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

const ORDER_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  FULFILLED: "Fulfilled",
};

export function orderStatusLabel(status: string): string {
  return ORDER_LABELS[status] ?? status;
}

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export function deliveryStatusLabel(status: string): string {
  return DELIVERY_STATUS_LABELS[status] ?? status;
}

/* ── Tracking freshness ────────────────────────────────────────────────────── */

/**
 * A driver is treated as stale once this much time passes without a location
 * ping. It matches the Redis TTL the API sets on `driver:{id}` (120s), so past
 * this point the driver has already dropped out of `GET /tracking/drivers` —
 * but the last known position is still worth showing rather than deleting.
 */
export const STALE_AFTER_MS = 120_000;

/** Age of a ping in ms, or null when there is no usable timestamp. */
export function msSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return null;
  return Math.max(0, Date.now() - at);
}

/** True when the last ping is older than STALE_AFTER_MS (or is missing). */
export function isStalePing(iso: string | null | undefined): boolean {
  const age = msSince(iso);
  return age === null || age > STALE_AFTER_MS;
}

/**
 * Relative age of the last ping: "just now", "45s ago", "6 min ago",
 * "Stale". Drives both the driver list and the "Stale" marker badge.
 */
export function freshnessLabel(iso: string | null | undefined): string {
  const age = msSince(iso);
  if (age === null) return "Stale";
  if (age > STALE_AFTER_MS) return "Stale";
  if (age < 10_000) return "just now";

  const seconds = Math.round(age / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  return `${Math.round(seconds / 60)} min ago`;
}

/** Compact "12.34, 56.78" for debugging and marker alt text. */
export function formatCoords(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
