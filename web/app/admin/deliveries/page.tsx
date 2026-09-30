import { requireAdmin } from "@/lib/server/guard";
import AppShell from "../../app-shell";
import AdminPage from "../AdminPage";

export const metadata = { title: "Lugica | Deliveries" };

export default async function AdminDeliveriesPage() {
  await requireAdmin();
  return (
    <AppShell>
      <AdminPage section="deliveries" />
    </AppShell>
  );
}
