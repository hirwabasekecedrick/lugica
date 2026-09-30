import { requireAdmin } from "@/lib/server/guard";
import AppShell from "../../app-shell";
import AdminPage from "../AdminPage";

export const metadata = { title: "Lugica | Vehicles" };

export default async function AdminVehiclesPage() {
  await requireAdmin();
  return (
    <AppShell>
      <AdminPage section="vehicles" />
    </AppShell>
  );
}
