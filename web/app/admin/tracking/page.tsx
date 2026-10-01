import { requireAdmin } from "@/lib/server/guard";
import AppShell from "../../app-shell";
import AdminPage from "../AdminPage";

export const metadata = { title: "Lugica | Live Tracking" };

export default async function AdminTrackingPage() {
  await requireAdmin();
  return (
    <AppShell>
      <AdminPage section="tracking" />
    </AppShell>
  );
}