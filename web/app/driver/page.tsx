import { requireRole } from "@/lib/server/guard";
import { DRIVER_ROLES } from "@/lib/roles";
import AppShell from "../app-shell";
import DriverHomeClient from "./DriverHomeClient";

export const metadata = { title: "Lugica | My Deliveries" };

/**
 * DRIVER-only route.
 *
 * The gate runs server-side against the verified JWT, and the API independently
 * filters `GET /deliveries` to `driverId = me`, so neither layer trusts the
 * other. Any other role is sent to /403.
 */
export default async function DriverPage() {
  await requireRole(DRIVER_ROLES);

  return (
    <AppShell>
      <DriverHomeClient />
    </AppShell>
  );
}