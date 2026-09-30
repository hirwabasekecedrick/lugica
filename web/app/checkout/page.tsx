import { requireAnyUser } from "@/lib/server/guard";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata = {
  title: "Lugica | Checkout",
};

export default async function CheckoutPage() {
  await requireAnyUser();
  return <CheckoutPageClient />;
}
