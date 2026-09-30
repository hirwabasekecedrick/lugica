import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, API_ORIGIN } from "@/lib/server/config";

/**
 * GET /api/cart/hydrated
 *
 * `GET /cart` returns bare CartItem rows with no product relation
 * (cart.service.ts:14), so the drawer cannot render name, price or stock.
 * The BFF joins the cart against the product list server-side so every page
 * gets a consistent view. See docs/API-GAPS.md #7.
 */

const UPSTREAM_TIMEOUT_MS = 15_000;

/** Max products fetched for the join. The API caps limit at 100. */
const PRODUCT_PAGE_SIZE = 100;

type CartItem = { productId: string; quantity: number };
type Cart = { items?: CartItem[] } | null;
type Product = {
  id: string;
  name: string;
  sku: string;
  priceMinorUnits: number;
  currency: string;
  stockQuantity: number;
  status: "ACTIVE" | "ARCHIVED";
  images?: { url: string; sortOrder: number }[];
};

export async function GET(): Promise<Response> {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const auth = { Authorization: `Bearer ${accessToken}` };

  const [cartRes, productsRes] = await Promise.all([
    fetch(`${API_ORIGIN}/cart`, {
      headers: auth,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    }),
    fetch(`${API_ORIGIN}/products?limit=${PRODUCT_PAGE_SIZE}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    }),
  ]);

  if (!cartRes.ok) {
    return NextResponse.json(
      { message: "Could not load cart", statusCode: cartRes.status },
      { status: cartRes.status },
    );
  }

  const cart = (await cartRes.json().catch(() => null)) as Cart;
  const products = productsRes.ok
    ? ((await productsRes.json().catch(() => [])) as Product[])
    : [];

  const byId = new Map(products.map((p) => [p.id, p]));

  const items = (cart?.items ?? []).map((item) => {
    const product = byId.get(item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      // Null when the product is archived or fell outside the page window, so
      // the drawer can show a placeholder rather than crashing.
      product: product ?? null,
      lineTotalMinorUnits: product ? product.priceMinorUnits * item.quantity : 0,
    };
  });

  const totalMinorUnits = items.reduce((sum, i) => sum + i.lineTotalMinorUnits, 0);
  const currency = products[0]?.currency ?? "RWF";

  return NextResponse.json({ items, totalMinorUnits, currency });
}
