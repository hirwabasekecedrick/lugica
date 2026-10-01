import React from "react";
import TrackDeliveryClient from "./TrackDeliveryClient";

export default async function TrackDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackDeliveryClient id={id} />;
}
