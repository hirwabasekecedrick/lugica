import { requireAdmin } from "@/lib/server/guard";
import AppShell from "../../app-shell";
import AdminPage from "../AdminPage";

export const metadata = { title: "Lugica | Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  return (
    <AppShell>
      <AdminPage section="orders" />
    </AppShell>
  );
}
