import { requireAnyUser } from "@/lib/server/guard";
import ShopPageClient from "./ShopPageClient";

/**
 * Server entry for the storefront. Enforces authentication, then hands off to
 * a client component that owns the interactive catalog state.
 */
export default async function ShopPage() {
  await requireAnyUser();
  return <ShopPageClient />;
}
