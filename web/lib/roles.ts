/**
 * Role checks shared by server and client code.
 *
 * Kept out of lib/server/session.ts so client components can use it without
 * pulling in `next/headers` or `jose`.
 */

export type Role = "ADMIN" | "SHOP_MANAGER" | "CLIENT" | "DRIVER";

export const WAREHOUSE_ROLES = ["ADMIN", "SHOP_MANAGER"] as const satisfies readonly Role[];
export const ADMIN_ROLES = ["ADMIN"] as const satisfies readonly Role[];
export const DRIVER_ROLES = ["DRIVER"] as const satisfies readonly Role[];
export const ANY_ROLES = [
  "ADMIN",
  "SHOP_MANAGER",
  "CLIENT",
  "DRIVER",
] as const satisfies readonly Role[];

export function hasRole(
  session: { role: string } | null | undefined,
  allowed: readonly Role[],
): boolean {
  return Boolean(session && (allowed as readonly string[]).includes(session.role));
}
