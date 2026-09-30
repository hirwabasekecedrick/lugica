# API Handoff — Gaps Found While Wiring the Web App

The web frontend is now fully wired to the API and shipping. During integration the
following backend gaps were found. Each is listed with the symptom it caused in the web,
so the impact is concrete rather than speculative.

Nothing here blocks the web app — every item was worked around in the frontend. These are
the changes that would let the frontend do the right thing instead of the fallback.

**Conventions used below**
- *Severity*: **blocker** (a feature is impossible), **degraded** (a feature works but
  renders invented or lossy data), **polish** (an inconsistency that costs a workaround).
- Every entry names the file and, where useful, the line or symbol.

---

## Summary

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | blocker | Auth | No `GET /auth/me`; login returns tokens only |
| 2 | blocker | Checkout | `POST /orders/checkout` takes no body; no address or payment fields on `Order` |
| 3 | blocker | Orders | `markOrderPaid` has no controller route — orders can never be paid |
| 4 | blocker | Catalog | `getNewArrivals` orders by an invalid Prisma relation |
| 5 | blocker | Media | No image upload endpoint; `images[].url` must be an absolute URL |
| 6 | degraded | Cart | `GET /cart` omits the `product` relation |
| 7 | degraded | Wishlist | `GET /wishlist` includes `product` but not `product.images` |
| 8 | degraded | Catalog | `GET /products` omits the `category` relation |
| 9 | degraded | Procurement | `GET /goods-receipts` omits `items` |
| 10 | degraded | Inventory | `Product` has no `minStockThreshold` |
| 11 | degraded | Inventory | `Product` has no `costPrice` |
| 12 | degraded | Inventory | No stock-movement or time-series endpoint |
| 13 | degraded | Orders | No endpoint to change an order's status |
| 14 | degraded | Infrastructure | No CORS configuration |
| 15 | degraded | Catalog | Search covers only name + SKU + category |
| 16 | degraded | Catalog | `searchText` is not recomputed when a category is renamed |
| 17 | degraded | Deliveries | `CreateDeliveryDto` requires fields the model discards |
| 18 | polish | Catalog | Products cannot be deleted, only archived |
| 19 | polish | Pagination | Inconsistent shapes across endpoints; no `totalPages` on orders; catalog cursor never returns the next cursor |
| 20 | polish | Seed | No `DRIVER` users and no vehicles |
| 21 | polish | Driver surfaces | No driver-facing web/mobile UI; `POST /locations/ping` is unused |

---

## Blockers

### 1. No `GET /auth/me`

**Location:** `api/src/modules/auth/auth.controller.ts`, `auth.service.ts`

`POST /auth/login` returns `{ accessToken, refreshToken }` and nothing else. There is no
endpoint to fetch the authenticated user, so the client is forced to decode the JWT for
`sub` / `email` / `role`.

**Web symptom:** the account page and the navbar display the email local-part as the user's
name (`client1` for `client1@lugica.com`). The real `name` and `phone` columns exist in
Prisma but are unreachable from the client.

**Requested:** `GET /auth/me` returning the `UserEntity` for the caller.

---

### 2. `POST /orders/checkout` takes no body

**Location:** `api/src/modules/orders/orders.controller.ts:20`, `prisma/schema.prisma` (`Order`)

The route accepts no DTO and builds the order entirely from the server-side cart. The
`Order` model has no shipping address, contact phone, or delivery instructions.

**Web symptom:** the original checkout form collected `customerName`, `customerEmail`,
`customerPhone`, `shippingAddress` and `paymentMethod`. All five fields had to be deleted.
The page is now a cart review plus a confirm button. The order records only which client
placed it.

**Requested:** either add the fields to `Order` and accept them in the checkout DTO, or
document that address capture is intentionally out of scope for this API.

---

### 3. `markOrderPaid` has no controller route

**Location:** `api/src/modules/orders/orders.service.ts:109` (`markOrderPaid`)

The service method exists and is complete, but no controller route calls it. The only
reachable order transitions are:

```
POST /orders/checkout  ->  PENDING_PAYMENT (expiresAt = now + 30 min)
                            |
                            +-- expiry job (orders.service.ts:158) --> EXPIRED
                                and stock is released via a RELEASE movement
```

**Web symptom:** the checkout success page must tell the user the order is *reserved*, not
paid, and explain that it will expire. There is no admin action to confirm payment, and
`/admin/orders` is read-only.

**Requested:** expose `POST /orders/:id/pay` (or an equivalent) restricted to staff, or an
explicit note that payment confirmation is handled out of band.

---

### 4. `getNewArrivals` orders by an invalid Prisma relation

**Location:** `api/src/modules/catalog/catalog.service.ts:63-71`

The query orders by `stockMovements: { _count: 'desc' }`. Prisma does not support ordering by
a relation's count in this form, and the surrounding code comment already flags
uncertainty. This endpoint appears to 500.

**Web symptom:** the storefront's "New Arrivals" section was omitted entirely rather than
risk a broken request on the main page.

**Requested:** fix the order clause — for example, a raw SQL `GROUP BY productId` ordered
by `COUNT(*)`, or an order by `createdAt DESC` if recency is the intent.

---

### 5. No image upload endpoint

**Location:** `api/src/modules/catalog/dto/create-product.dto.ts:16`

`images[].url` is validated as `z.string().url()`, so an absolute URL is required.
Relative paths such as `/products/tracker.jpg` are rejected. The seed creates no
`ProductImage` rows.

**Web symptom:** the catalog renders the `ProductIcon` fallback for every product out of the
box, because no product has an image. There is no way for an admin to upload one from the
UI — an operator would have to host images elsewhere and paste absolute URLs into a request
by hand.

**Requested:** either an upload endpoint returning a URL (and static asset serving), or a
documented external image host plus a form field in the catalog screen.

---

## Degraded

### 6. `GET /cart` omits the `product` relation

**Location:** `api/src/modules/cart/cart.service.ts:14` — `include: { items: true }`

Items come back as bare `CartItem` rows. Without the product there is no name, no price, no
stock level, and no image.

**Web workaround:** `web/app/api/cart/hydrated/route.ts` fetches the cart and
`GET /products?limit=100` in parallel and joins them server-side. This is a second source of
truth and can drift from stock if a product is archived or falls outside the 100-item page.

**Requested:** `include: { items: { include: { product: { include: { images: true } } } } }`.

---

### 7. `GET /wishlist` includes `product` but not `product.images`

**Location:** `api/src/modules/wishlist/wishlist.service.ts:10-14`

**Web symptom:** wishlist tiles always use the icon fallback, even for products that do have
images.

**Requested:** add `images` to the include.

---

### 8. `GET /products` omits the `category` relation

**Location:** `api/src/modules/catalog/catalog.service.ts:27-37` (includes `images` only)

`ProductEntity` exposes `categoryId` but no category object.

**Web workaround:** the storefront fetches the category tree separately from
`GET /categories` and joins in the client. Harmless here, but it means a category rename
appears only after both requests land.

**Requested:** include `category: { select: { id, name } }`, as `GET /admin/products`
already does.

---

### 9. `GET /goods-receipts` omits `items`

**Location:** `api/src/modules/procurement/procurement.service.ts:64-68`

Only `GET /goods-receipts/:id` includes line items.

**Web symptom:** the receipt log shows a supplier and date but no contents, and the UI
labelled the count `items hidden`. Rendering counts would require N+1 detail fetches, which
the plan deliberately avoided — the global throttle is 100 requests per 60 seconds
(`app.module.ts:39`), so a long receipt list could trip it.

**Requested:** include `items` in the list response. Line counts are small enough that this
is cheap.

---

### 10. `Product` has no `minStockThreshold`

**Location:** `api/prisma/schema.prisma`

Stock status has to be derived, and low-stock is a per-product business decision.

**Web workaround:** `web/lib/format.ts` uses a single global `LOW_STOCK_THRESHOLD = 10` for
every product. The warehouse "Restock Queue" and the storefront's "Only N left" badge both
depend on it, and both will be wrong for any SKU with a different reorder point.

**Requested:** add `minStockThreshold Int @default(10)` to `Product`.

---

### 11. `Product` has no `costPrice`

**Location:** `api/prisma/schema.prisma`

The only cost data in the system is `GoodsReceiptItem.unitCostMinorUnits`, reachable only
through a goods-receipt detail request.

**Web workaround:** the warehouse "Cost base" KPI was removed rather than fabricated. The
dashboard now shows **retail** value, which is honest but is not the same number, and gross
margin cannot be computed at all.

**Requested:** add `costPriceMinorUnits Int?` to `Product`, maintained on goods receipt.

---

### 12. No stock-movement or time-series endpoint

**Location:** no route exists, though the `StockMovement` model and entity do

The model records `RECEIPT`, `SALE`, `RELEASE`, `ADJUSTMENT`, `DAMAGED` and `WRITE_OFF`
movements, but nothing exposes them.

**Web symptom:** the warehouse dashboard's "Recent Inventory Movements" panel and its
inbound/outbound chart could not be built. The chart was reading a hardcoded array behind a
7d/30d/90d toggle that did nothing; both were removed. The receipt log was substituted,
which is a proxy for movements but omits sales and adjustments.

**Requested:** `GET /admin/stock-movements` with product and date-range filters.

---

### 13. No endpoint to change an order's status

**Location:** `api/src/modules/orders/orders.controller.ts` — read routes only

**Web symptom:** `/admin/orders` is explicitly read-only and says so in the UI. Staff cannot
mark an order paid, cancel it, or mark it fulfilled.

**Requested:** see #3 — this is the same missing capability seen from the other side.

---

### 14. No CORS configuration

**Location:** `api/src/main.ts` — `enableCors()` is never called

Any direct browser request to the API fails. This is currently fine by design, because the
web app proxies everything through a Next.js BFF at `web/app/api/[...path]/route.ts`, which
also keeps the tokens in httpOnly cookies where browser JavaScript cannot read them.

**Note:** the BFF is not free — it is an extra hop and an extra place for bugs. If the team
prefers direct calls, CORS must be enabled and token storage has to be revisited.

---

### 15. Search covers only name + SKU + category

**Location:** `api/src/modules/catalog/search.service.ts`, `searchText` built at
`api/src/modules/inventory/inventory.service.ts:14-18`

`GET /products/search?q=` matches `name + sku + categoryName`. The `description` column is
never searched.

**Web symptom:** the storefront search placeholder now reads "Search by name, SKU, or
category…" rather than promising a description match. Users looking for "waterproof" will
not find waterproof products unless the word is in the name.

**Requested:** include `description` in `searchText`, or confirm the narrower scope is
intended.

---

### 16. `searchText` is not recomputed when a category is renamed

**Location:** `api/src/modules/inventory/inventory.service.ts:34-36`

`searchText` is refreshed on product create/update but not when a category name changes, so
search results for the old name persist.

**Requested:** recompute affected products' `searchText` inside `updateCategory`.

---

### 17. `CreateDeliveryDto` requires fields the model discards

**Location:** `api/src/modules/deliveries/dto/create-delivery.dto.ts:11-12`,
`api/src/modules/deliveries/deliveries.service.ts:17-30`

The DTO requires `packageDetails` and `clientId`. The `Delivery` model has neither column,
and the service discards the package details. `clientId` is overwritten with the caller's
own id, so the supplied value is meaningless.

**Web workaround:** `web/lib/api/deliveries.ts` sends both fields with a comment explaining
that they exist only to satisfy validation, and deliberately omits a delivery-creation form
from the UI so nobody enters data that gets thrown away.

**Requested:** drop `packageDetails` from the DTO, or add a column for it. Clarify whether
`clientId` should be accepted at all, since the caller is always the client.

---

## Polish

### 18. Products cannot be deleted, only archived

**Location:** `api/src/modules/inventory/inventory.controller.ts` — no delete route

**Web workaround:** the catalog action is labelled "Archive" and the UI explains that
archiving hides a product from the storefront while keeping it in the warehouse. Archived
rows are still returned by `GET /admin/products`, so the catalog has a "Show archived"
filter.

**Requested:** confirm archive-only is the intended policy, or add a hard delete for
products with no order history.

---

### 19. Inconsistent pagination and cursors

Three different shapes are in use:

| Endpoint | Shape |
|---|---|
| `GET /products` | cursor-paginated array, **next cursor never returned** |
| `GET /orders`, `GET /admin/orders` | `{ data, meta: { page, limit, total } }` — **no `totalPages`** |
| `GET /users` | `{ data, meta: { page, limit, total, totalPages } }` |
| `GET /admin/products` | **bare array** |

**Web symptom:** the client needs a wrapper per endpoint, and `web/lib/api/types.ts` marks
`totalPages` optional purely because one endpoint omits it. Catalog pagination is limited to
the first page in practice, since there is no way to request the next one.

**Requested:** a single pagination contract, and return the next cursor from `GET /products`.

---

### 20. Seed creates no `DRIVER` users and no vehicles

**Location:** `api/prisma/seed.ts`

The seed creates 1 admin, 1 shop manager, and 3 clients. Nothing has `Role.DRIVER`, and
there are no `Vehicle` rows.

**Web symptom:** on a fresh database, `/admin/deliveries` cannot be exercised — the assign
form shows "No active drivers. Create one under Users & Drivers." The warehouse and admin
surfaces were built in dependency order for this reason: **Users → Vehicles → Deliveries**.

**Requested:** seed at least one driver and one company vehicle so the fleet flow is
testable out of the box.

---

### 21. No driver-facing surface

**Location:** `api/src/modules/locations/locations.controller.ts`

`POST /locations/ping` is `DRIVER`-only and throttled to 5 requests per second. The web app
does not implement a driver UI and does not call this endpoint.

**Requested:** confirm this belongs to a separate mobile client. If drivers are expected to
use the web app, the role set needs a dedicated route tree and a map integration.

---

## What the web app does that is worth keeping

For context, since the API team will now review the frontend:

- `web/app/api/[...path]/route.ts` — the BFF. Handles token rotation, 401 retry, and a
  15-second upstream timeout so a dead API returns 502 instead of hanging.
- `web/lib/server/session.ts` — verifies JWT claims with `jose`; the raw token is never
  exposed to client components.
- `web/lib/format.ts` — `formatMoney` renders by currency. **RWF is zero-decimal**, so
  `priceMinorUnits` is displayed without dividing by 100. If USD or EUR products are ever
  added, the same value is divided. This is the single most likely place for a pricing bug.
- `web/docs/phase-0-next16-conventions.md` — Next 16 notes, including that `middleware.ts`
  is now `proxy.ts` and having both breaks the build.
