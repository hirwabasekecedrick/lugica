import { NextResponse, type NextRequest } from "next/server";

/**
 * Presence-level route gating, using the Next 16 `proxy.ts` convention.
 * `middleware.ts` is deprecated in this version and having both makes the
 * build throw. See web/docs/phase-0-next16-conventions.md.
 *
 * This is a redirect for UX only. Role enforcement lives in the server
 * layouts (which can await cookies) and, decisively, in the API's
 * JwtAuthGuard/RolesGuard — bypassing this grants nothing.
 */

const ACCESS_COOKIE = "lugica_at";

const PUBLIC_PATHS = new Set(["/", "/login"]);

const PUBLIC_FILE = /\.(?:ico|png|jpg|jpeg|svg|webp|gif|woff2?|txt|xml|json)$/i;

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (PUBLIC_FILE.test(pathname)) return NextResponse.next();
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Presence check only. A stale or forged token still gets past here, but the
  // BFF refreshes it and the API rejects it if invalid.
  if (!request.cookies.get(ACCESS_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
