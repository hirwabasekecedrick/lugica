import { requireDriver } from "@/lib/server/guard";
import AppShell from "../../../app-shell";
import DeliveryDetailClient from "./DeliveryDetailClient";

export const metadata = {
  title: "Lugica | Delivery Details",
  description: "Live progress of a delivery you are carrying.",
};

/**
 * DRIVER-only route for one delivery.
 *
 * Ported from `/driver1/deliveries/[id]`, whose links from `/driver1` pointed at
 * `/driver/deliveries/{id}` — a route that did not exist, so every delivery card
 * 404'd. The page now also uses the shared tracking components instead of the
 * driver1-local telemetry client, so the driver's own map shows the same
 * from/driver/to picture as the admin and client views.
 */
export default async function DriverDeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDriver();

  const { id } = await params;

  return (
    <AppShell>
      <DeliveryDetailClient id={id} />
    </AppShell>
  );
}