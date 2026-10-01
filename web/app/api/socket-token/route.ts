import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { JWT_ACCESS_SECRET } from "@/lib/server/config";
import { readSession } from "@/lib/server/session";

/**
 * Mint a short-lived token for the Socket.IO tracking gateway.
 *
 * Why this exists: Socket.IO authenticates from the handshake
 * (`auth.token` or `Authorization: Bearer`), and the gateway verifies with the
 * *shared* JwtService — `jwtService.verify(token)` against
 * `jwt.accessSecret` (tracking.module.ts:19, tracking.gateway.ts:310). There is
 * no separate socket secret and no audience/type claim the gateway checks, so a
 * purpose-scoped token still has to be signed with the access secret and carry
 * the full { sub, email, role } payload the gateway reads.
 *
 * The main access token stays in its httpOnly cookie and is never handed to
 * browser JavaScript. This token is deliberately short-lived (5 min) so a
 * leaked copy is useless for REST calls, and the client refetches it whenever
 * the socket reconnects.
 */

const SOCKET_TOKEN_TTL = "5m";

export async function GET(): Promise<Response> {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (!JWT_ACCESS_SECRET) {
    return NextResponse.json(
      { message: "JWT_ACCESS_SECRET is not configured" },
      { status: 500 },
    );
  }

  const token = await new SignJWT({
    email: session.email,
    role: session.role,
    // Advisory only: the gateway ignores it, but it documents intent and lets a
    // future API-side check reject a socket token used as a REST bearer token.
    purpose: "socket",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(SOCKET_TOKEN_TTL)
    .sign(new TextEncoder().encode(JWT_ACCESS_SECRET));

  return NextResponse.json({ token, expiresIn: SOCKET_TOKEN_TTL });
}