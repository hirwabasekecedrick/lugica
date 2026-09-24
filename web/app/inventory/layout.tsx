import React from "react";

export const metadata = {
  title: "Lugica | Inventory",
  description: "Inventory dashboard for Lugica Delivery Express.",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
