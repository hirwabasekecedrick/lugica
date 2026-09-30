import { requireWarehouse } from "@/lib/server/guard";
import AppShell from "../app-shell";
import InventoryPageClient from "./InventoryPageClient";

export const metadata = {
  title: "Lugica | Inventory",
  description: "Inventory dashboard for Lugica Delivery Express.",
};

export default async function InventoryPage() {
  // ADMIN and SHOP_MANAGER only. The API enforces the same rule.
  await requireWarehouse();

  return (
    <AppShell>
      <InventoryPageClient />
    </AppShell>
  );
}
