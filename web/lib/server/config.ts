/**
 * Server-only configuration for the BFF proxy.
 *
 * Never import this from a client component: it reads secrets.
 */

/**
 * Resolve and validate the API origin at module load.
 *
 * A malformed value here (a stray space, a trailing note from an editor) used
 * to surface as `TypeError: Invalid URL` from deep inside the proxy, which
 * gave no clue about the cause. Trim and validate here so the message names
 * the offending variable.
 */
function resolveApiOrigin(): string {
  const raw = process.env.API_ORIGIN?.trim() || "http://localhost:8080";

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `API_ORIGIN is not a valid URL: ${JSON.stringify(raw)}. ` +
        `Set it in web/.env.local, e.g. API_ORIGIN=http://localhost:8080`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      `API_ORIGIN must use http or https, got ${JSON.stringify(raw)}`,
    );
  }

  // Strip a trailing slash so `${API_ORIGIN}/${path}` never doubles up.
  return url.origin;
}

export const API_ORIGIN = resolveApiOrigin();

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "";

export const ACCESS_COOKIE = "lugica_at";
export const REFRESH_COOKIE = "lugica_rt";

/**
 * Access tokens last 15m (api JWT_ACCESS_EXPIRATION). Refresh a little before
 * expiry so an in-flight request does not race the deadline.
 */
export const ACCESS_COOKIE_MAX_AGE = 15 * 60;

/** Refresh tokens last 7d (api JWT_REFRESH_EXPIRATION). */
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
