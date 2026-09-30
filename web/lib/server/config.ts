/**
 * Server-only configuration for the BFF proxy.
 *
 * Never import this from a client component: it reads secrets.
 */

export const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

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
