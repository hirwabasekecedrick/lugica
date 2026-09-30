import { requireAdmin } from "@/lib/server/guard";
import AppShell from "../../app-shell";
import AdminPage from "../AdminPage";

export const metadata = {
  title: "Lugica | Admin",
};

/**
 * Admin section. ADMIN only — every route here is ADMIN-gated in the API too.
 *
 * The default segment is users, because the seed creates no DRIVER accounts or
 * vehicles, so delivery assignment cannot be exercised until an admin creates
 * a driver from this page.
 */
export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <AppShell>
      <AdminPage section="users" />
    </AppShell>
  );
}
