import { requireDriver } from "@/lib/server/guard";
import AppShell from "../../../app-shell";
import DeliveryDetailClient from "./DeliveryDetailClient";

export const metadata = {
  title: "Lugica | Delivery Detail",
  description: "Delivery details and live tracking for Lugica Delivery Express.",
};

export default async function DeliveryDetailPage({
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
