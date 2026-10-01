import React from "react";
import { requireSession } from "@/lib/server/guard";
import TrackDeliveryClient from "./TrackDeliveryClient";

export const metadata = {
  title: "Lugica | Track Delivery",
  description: "Follow your delivery in real time.",
};

/**
 * Client-facing delivery tracking.
 *
 * Gated on any signed-in user; the API decides whether this particular delivery
 * belongs to the caller (`assertDeliveryAccess`), since an id in the URL is not
 * authorisation. The check here is what stops the page rendering at all for an
 * anonymous visitor — the previous version had no gate at all.
 */
export default async function TrackDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();

  const { id } = await params;
  return <TrackDeliveryClient id={id} />;
}