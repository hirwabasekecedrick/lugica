import { api } from "./client";
import type { RegisterResponse, Role } from "./types";

/**
 * Auth endpoints.
 *
 * The BFF intercepts these three paths and manages the cookies, so they return
 * `{ ok: true }` rather than token material. `POST /auth/register` also returns
 * no tokens, so signup must log in immediately afterwards.
 */

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export const auth = {
  /** Sets cookies, returns nothing useful. */
  login: (input: LoginInput) =>
    api.post<{ ok: true; role: Role | null }>("/auth/login", input),

  /** Returns the created user but NO tokens — follow with `login`. */
  register: (input: RegisterInput) => api.post<RegisterResponse>("/auth/register", input),

  /** Revokes the refresh token server-side and clears both cookies. */
  logout: () => api.post<{ ok: true }>("/auth/logout"),
};

/** Roles that may reach each surface. Mirrors the API's @Roles decorators. */
export const ROLE = {
  warehouse: ["ADMIN", "SHOP_MANAGER"] satisfies readonly Role[],
  admin: ["ADMIN"] satisfies readonly Role[],
} as const;
