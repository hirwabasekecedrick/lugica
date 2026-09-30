import { requireAnyUser } from "@/lib/server/guard";
import AppShell from "../app-shell";
import AccountPageClient from "./AccountPageClient";

export const metadata = {
  title: "Lugica | My Account",
};

export default async function AccountPage() {
  await requireAnyUser();

  return (
    <AppShell>
      <AccountPageClient />
    </AppShell>
  );
}
