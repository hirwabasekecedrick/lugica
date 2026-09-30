import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  API_ORIGIN,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
} from "@/lib/server/config";
import { readRefreshToken } from "@/lib/server/session";

type Params = { path?: string[] };

/** Upstream fetch timeout, so a dead API returns 502 instead of hanging. */
const UPSTREAM_TIMEOUT_MS = 15_000;

type Tokens = { accessToken: string; refreshToken: string };

type UpstreamResult = {
  response: Response;
  ok: boolean;
  status: number;
  data?: unknown;
};

/**
 * Catch-all BFF proxy: /api/<path> -> ${API_ORIGIN}/<path>.
 *
 * The browser never contacts the API directly, so the API needs no CORS config
 * and the tokens stay in httpOnly cookies (docs/API-GAPS.md #2).
 */
async function handler(
  request: Request,
  context: { params: Promise<Params> },
): Promise<Response> {
  const { path: segments = [] } = await context.params;
  const path = segments.map(encodeURIComponent).join("/");

  if (request.method === "POST" && isAuthRoute(path)) {
    return handleAuthRoute(path, request);
  }

  return forwardWithRefresh(path, request);
}

function isAuthRoute(path: string): boolean {
  return path === "auth/login" || path === "auth/register" || path === "auth/logout";
}

async function handleAuthRoute(path: string, request: Request): Promise<Response> {
  let body = await readBody(request);

  // POST /auth/logout requires a { refreshToken } body (refresh-token.dto.ts),
  // but the client cannot read the httpOnly cookie, so supply it here.
  if (path === "auth/logout") {
    const refreshToken = await readRefreshToken();
    body = refreshToken ? JSON.stringify({ refreshToken }) : null;
  }

  const upstream = await callUpstream(path, "POST", request, body, {
    withAuth: path === "auth/logout",
  });

  if (path === "auth/logout") {
    // Always clear locally, even if the upstream call failed, so nobody is
    // stuck in a half-logged-out state.
    await clearAuthCookies();
    return upstream.response;
  }

  // Register returns { user: {...} } and deliberately no tokens
  // (auth.service.ts:36). Pass the created user straight through and leave the
  // client to follow up with /auth/login. Requiring tokens here would 502 on
  // every successful signup.
  if (path === "auth/register") {
    return upstream.response;
  }

  if (!upstream.ok) return upstream.response;

  const tokens = upstream.data as Partial<Tokens> | undefined;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    return NextResponse.json(
      { message: "Login did not return a token pair" },
      { status: 502 },
    );
  }

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  // Never return token material to the browser. The role claim is echoed back so
  // the client can choose a landing route; it is a UX hint only, since every
  // authorization decision still happens server-side in readSession().
  const claims = decodeJwt(tokens.accessToken);
  const role = typeof claims.role === "string" ? claims.role : null;

  return NextResponse.json({ ok: true, role });
}

/** All non-auth routes: attach the bearer token, refresh once on 401, retry. */
async function forwardWithRefresh(path: string, request: Request): Promise<Response> {
  const method = request.method;
  const body = await readBody(request);

  let result = await callUpstream(path, method, request, body, { withAuth: true });

  if (result.status === 401) {
    const rotated = await rotateTokens();
    if (rotated) {
      // Retry with the new cookie. The body was buffered above so it replays.
      result = await callUpstream(path, method, request, body, { withAuth: true });
    }
  }

  if (result.status === 401) {
    await clearAuthCookies();
    return NextResponse.json(
      { message: "Session expired", statusCode: 401 },
      { status: 401 },
    );
  }

  return result.response;
}

/**
 * Rotate the token pair. The API revokes the old refresh token on every call
 * (auth.service.ts:122-124), so both cookies must be replaced together.
 */
async function rotateTokens(): Promise<boolean> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return false;

  let res: Response;
  try {
    res = await fetch(`${API_ORIGIN}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return false;
  }

  if (!res.ok) return false;

  const data = (await res.json().catch(() => null)) as Partial<Tokens> | null;
  if (!data?.accessToken) return false;

  await setAuthCookies(data.accessToken, data.refreshToken ?? refreshToken);
  return true;
}

async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_COOKIE_MAX_AGE });
  jar.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  // ReadonlyRequestCookies strips clear(); delete() is the supported route.
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

async function callUpstream(
  path: string,
  method: string,
  request: Request,
  body: BodyInit | null,
  options: { withAuth?: boolean },
): Promise<UpstreamResult> {
  const url = new URL(`${API_ORIGIN}/${path}`);
  new URL(request.url).searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {};
  if (body) {
    headers["Content-Type"] = request.headers.get("content-type") ?? "application/json";
  }

  if (options.withAuth) {
    const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return {
      response: NextResponse.json(
        { message: "API unreachable", statusCode: 502 },
        { status: 502 },
      ),
      ok: false,
      status: 502,
    };
  }

  const text = await upstream.text();

  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  return {
    // Pass status and body through unchanged so the client sees the API's own
    // error shape, which web/lib/api/errors.ts knows how to read.
    response: new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    }),
    ok: upstream.ok,
    status: upstream.status,
    data,
  };
}

/** Buffers the body once so it survives a retry after refresh. */
async function readBody(request: Request): Promise<BodyInit | null> {
  if (request.method === "GET" || request.method === "HEAD") return null;
  return (await request.text()) || null;
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
