# Phase 0 — Next 16.3.5 Convention Verification

Verified against the installed package at `web/node_modules/next` (v16.3.5), not from training data.
The bundled `dist/docs/index.md` is a 67-line landing page with no substantive reference, so the
source and `.d.ts` files were inspected directly.

## 1. Request interception: `proxy.ts`, not `middleware.ts`

`next/dist/lib/constants.js:287-290` defines both filenames, but `setup-dev-bundler.js` contains the
decisive logic:

- If **both** `middleware.*` and `proxy.*` exist at the app root, the build **throws**:
  > `Both middleware file "./middleware" and proxy file "./proxy" are detected. Please use "./proxy" only.`

- If only `middleware.*` exists, the build **warns**:
  > `The "middleware" file convention is deprecated. Please use "proxy" instead.`

- Turbopack distinguishes them via a `isProxy` flag (`turbopack-utils.js:548`) to pick the right
  `triggerName`, so `proxy` is a first-class path, not an alias.

**Decision:** use `web/proxy.ts`. Never create a `middleware.ts` alongside it — the build errors out.

Export shape: a default-exported function taking `NextRequest` and returning `NextResponse | null`,
matching the middleware signature. The filename is the only thing that changed.

## 2. `cookies()` is async

`next/dist/server/request/cookies.d.ts:2`:

```ts
export declare function cookies(): Promise<ReadonlyRequestCookies>;
```

Must be awaited. The returned type is `ReadonlyRequestCookies` — defined in
`web/spec-extension/adapters/request-cookies.d.ts:5` as:

```ts
Omit<RequestCookies, 'set' | 'clear' | 'delete'> & Pick<ResponseCookies, 'set' | 'delete'>
```

So `get`/`getAll`/`has` are available, and so are `set`/`delete` — but **`clear()` is stripped**.
To clear a cookie, call `delete(name)` (or `set` with `maxAge: 0`). Any plan code that assumes a
synchronous `cookies()` or a `.clear()` method will fail to compile.

## 3. Route params are typed via generated globals

`layout.tsx:22` already uses `LayoutProps<"/">`, a Next-generated global. This confirms typed routes
are enabled and the `props` object is supplied by the framework rather than hand-annotated. For the
catch-all BFF handler, params arrive as a Promise-wrapped object consistent with the rest of the
App Router in this version, so the handler signature will be written defensively rather than assuming
a plain object.

`tsconfig.json` includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` (lines 29-30), so these
globals only exist after a build/dev run. Until then they are unresolved — the first `pnpm build`
is what materialises them.

## 4. Practical consequences for later phases

- `proxy.ts` gates routes; do not import `jose`'s Node-only APIs there without checking the runtime.
  Edge runtime limits are the reason to keep `readSession()` for server components and route handlers
  rather than the proxy.
- Every `cookies()` call site needs `await`.
- Cookie clearing is `delete()`, never `clear()`.
- The BFF catch-all must forward method, path, query and body itself; there is no built-in rewrite
  in this build that was found, so `next.config.ts` stays untouched.

## Remaining unknowns to confirm at first build

- Exact generated type name for the catch-all `params` (check `.next/types` after the first build).
- Whether `jose` needs an explicit `export const runtime` on `proxy.ts`.

These are contained: they affect one signature each, not the architecture. The plan's phases stand.
