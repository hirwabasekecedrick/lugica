import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  JWT_ACCESS_SECRET,
  REFRESH_COOKIE,
} from "./config";

/**
 * The only identity information the API makes available to a client.
 * `POST /auth/login` returns tokens with no user object and there is no
 * `GET /auth/me`, so name/phone are unreachable. See docs/API-GAPS.md #1.
 */
export type Session = {
  sub: string;
  email: string;
  role: "ADMIN" | "SHOP_MANAGER" | "CLIENT" | "DRIVER";
};

export type SessionUser = Session & {
  /** Email local-part, e.g. "client1" from "client1@lugica.com". */
  displayName: string;
  initials: string;
};

/**
 * Verify the access-token cookie and return its claims, or null if absent,
 * malformed, or expired. Never throws — callers treat null as "logged out".
 */
export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token || !JWT_ACCESS_SECRET) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_ACCESS_SECRET),
    );

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as Session["role"],
    };
  } catch {
    // Signature mismatch or expired. The BFF refreshes proactively; a failure
    // here means the session is genuinely dead.
    return null;
  }
}

/** Session plus display fields derived from the email. */
export async function readSessionUser(): Promise<SessionUser | null> {
  const session = await readSession();
  if (!session) return null;

  const local = session.email.split("@")[0] ?? session.email;

  return {
    ...session,
    displayName: local,
    initials: local.slice(0, 2).toUpperCase(),
  };
}

/** Read the raw refresh token, used only by the BFF for /auth/refresh. */
export async function readRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}

export { hasRole } from "@/lib/roles";
