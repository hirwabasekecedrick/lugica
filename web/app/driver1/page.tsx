import { requireDriver } from "@/lib/server/guard";
import AppShell from "../app-shell";
import DriverPageClient from "./DriverPageClient";

export const metadata = {
  title: "Lugica | Driver Dashboard",
  description: "Driver dashboard for Lugica Delivery Express.",
};

export default async function DriverPage() {
  await requireDriver();

  return (
    <AppShell>
      <DriverPageClient />
    </AppShell>
  );
}
