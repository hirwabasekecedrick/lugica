import type { ReactNode } from "react";
import { readSessionUser } from "@/lib/server/session";
import { SessionProvider } from "./lib/session-context";

/**
 * Shell for every authenticated page. Reads the verified JWT claims on the
 * server and hands them to client components, so no token is ever serialized
 * into the page payload.
 */
export default async function AppShell({ children }: { children: ReactNode }) {
  const user = await readSessionUser();

  return <SessionProvider user={user}>{children}</SessionProvider>;
}
