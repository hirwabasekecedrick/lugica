import { redirect } from "next/navigation";
import { readSession, type Session } from "@/lib/server/session";
import { hasRole, WAREHOUSE_ROLES, ADMIN_ROLES, ANY_ROLES } from "@/lib/roles";

/**
 * Server-side role gate for a route segment.
 *
 * This is the real web-side permission check. It runs in a server component,
 * so `cookies()` is awaitable and the token is verified. The API remains the
 * authority — see its @Roles decorators.
 */

/** Require any signed-in user, redirecting anonymous visitors to /login. */
export async function requireSession(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

/** Require one of the given roles, redirecting to /403 when the role is wrong. */
export async function requireRole(allowed: readonly Session["role"][]): Promise<Session> {
  const session = await requireSession();
  if (!hasRole(session, allowed)) redirect("/403");
  return session;
}

export const requireWarehouse = () => requireRole(WAREHOUSE_ROLES);
export const requireAdmin = () => requireRole(ADMIN_ROLES);
export const requireAnyUser = () => requireRole(ANY_ROLES);

export { WAREHOUSE_ROLES, ADMIN_ROLES, ANY_ROLES };
