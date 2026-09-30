"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/lib/server/session";

/**
 * Identity for client components.
 *
 * The API exposes no endpoint to fetch the logged-in user, so this is derived
 * from the verified JWT claims and passed down from a server layout. `name` and
 * `phone` are genuinely unavailable — see docs/API-GAPS.md #1.
 */
const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionUser | null {
  return useContext(SessionContext);
}
