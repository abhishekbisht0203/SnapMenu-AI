# SnapMenu AI

**A restaurant owner photographs their paper menu, AI turns it into a digital menu with a QR code in seconds, and customers order from their table — orders stream live to a kitchen dashboard.**

SnapMenu AI is a multi-tenant SaaS platform (Laravel 12 API + React/TypeScript) that converts
photographed restaurant menus into digital ordering experiences via an OCR + LLM pipeline, with
real-time order broadcasting, QR-based anonymous customer ordering, and a kitchen dashboard.

---

## 1. Problem

Small restaurants and cafés still hand out paper menus and take orders on notepads. Going digital
normally means re-typing every dish into some SaaS dashboard and paying for a designer. SnapMenu AI
removes the data-entry step entirely: photograph the existing menu, let the AI structure it, correct
anything it got wrong, print the QR code, done. Customers order without installing anything or signing
in, and the kitchen sees every order the instant it's placed.

## 2. Architecture

```
                       ┌─────────────────────┐
   Owner / Kitchen ───▶│  owner.html  (SPA)  │─┐        ┌──────────────────┐
                       └─────────────────────┘ │  HTTPS │  Laravel 12 API  │
                       ┌─────────────────────┐ ├───────▶│  (Sanctum auth)  │
   Diner (QR scan) ───▶│ customer.html (PWA) │─┘        │                  │
                       └─────────────────────┘          │  tenant scope    │
                                                        │  order service   │
                                                        └────────┬─────────┘
                                     ┌───────────────┐           │
                                     │ queue worker  │◀──────────┤ ProcessMenuUpload
                                     │  OCR + LLM     │           │
                                     └───────────────┘           │
                                     ┌───────────────┐           │
                                     │ Reverb server │◀──────────┘ OrderPlaced / OrderStatusUpdated
                                     │  (websockets) │──────────▶ kitchen dashboard (no polling)
                                     └───────────────┘
```

One API, two frontends with **different auth models**: the owner dashboard holds a Sanctum bearer
token; the customer PWA is fully anonymous and is scoped only by a restaurant slug or a table's QR
token.

## 3. Key technical decisions

**Multi-tenancy via global scopes.** Every tenant-owned model (`MenuItem`, `Order`, `Table`, …) uses
the `BelongsToRestaurant` trait. An `IdentifyRestaurant` middleware resolves the authenticated user's
restaurant into a request-scoped `TenantManager`; a global `RestaurantScope` then constrains *every*
query, and a `creating` hook stamps `restaurant_id` on every insert. Controllers never filter by
tenant by hand, so a forgotten `where()` can't leak another restaurant's data. Proven by
`tests/Feature/Tenancy/TenantIsolationTest.php`.

**Confidence-based human-in-the-loop menu review.** The AI is never trusted blindly. `ParsedMenu`
defensively validates and type-checks every row the LLM returns, then scores confidence as the
fraction of rows that came back complete and well-typed. Above the threshold the upload is `parsed`;
below it the upload is held as `needs_review` and staged for the owner to edit and approve before any
item goes live. A parse that yields nothing fails gracefully instead of corrupting the menu.

**Real-time order broadcasting.** New orders fire `OrderPlaced` and status changes fire
`OrderStatusUpdated` on the private `restaurant.{id}` channel. The kitchen dashboard subscribes once
and receives orders instantly — no polling. (Locally the broadcast connection is `log` / a polling
fallback; production runs Laravel Reverb.)

**Idempotent Stripe webhooks.** `POST /api/webhooks/stripe` verifies the Stripe signature, then
records every `event_id` in `webhook_events`. A duplicate delivery is detected and ignored — the
subscription is activated and the `Payment` row written exactly once.

**QR-token anonymous access.** Customers never authenticate. A table's unguessable `qr_code_token`
resolves to a restaurant + table server-side; orders placed against it are still fully scoped and
validated (item must belong to that restaurant and be available; totals are computed server-side).

**Guarded order state machine.** `Order::TRANSITIONS` defines the only legal moves
(`placed → confirmed → preparing → ready → served`, or `cancelled`). The `OrderService` rejects any
other transition with a 422.

## 4. Tech stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Database | SQLite (local) → MySQL 8 (prod) — swap via `.env`, no code change |
| Auth | Laravel Sanctum (owner) · QR token (customer) |
| RBAC | spatie/laravel-permission — `Owner`, `Staff` |
| Queue | `database` driver (local) → Redis (prod) |
| OCR | Fake engine (local) · Tesseract CLI · Google Vision-ready interface |
| AI parsing | OpenAI Chat Completions (JSON mode) behind a `MenuParser` interface |
| Real-time | Laravel Reverb / broadcast events |
| Payments | Stripe (test mode) — subscription model + idempotent webhooks |
| QR codes | simplesoftwareio/simple-qrcode (SVG) |
| Frontend | React 18 + Vite + TypeScript + Tailwind (two SPAs, one API) |
| Testing | Pest — 50 tests / 146 assertions |
| CI | GitHub Actions — Pint + Pest + frontend build |

## 5. Local setup

```bash
# Backend
cd snapmenu-ai
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed          # seeds a demo restaurant in local env
php artisan serve                   # http://127.0.0.1:8000
php artisan queue:work              # processes menu uploads

# Frontend
cd frontend
npm install
npm run dev                         # http://localhost:5173
#   owner dashboard  → http://localhost:5173/owner.html
#   customer ordering → http://localhost:5173/customer.html#/r/demo-bistro
```

Demo credentials (local seed): `owner@demo.test` / `password` (Owner),
`kitchen@demo.test` / `password` (Staff).

### Demo flow

1. Owner dashboard → **Upload** → pick any menu photo → the queued job OCR + parses it → **Review** →
   approve → items are live.
2. Owner dashboard → **Tables** → each table has a printable QR code.
3. Open the customer PWA at a table's URL → add items → place order.
4. Owner dashboard → **Kitchen** → the order is already there; advance it through the state machine
   and watch the customer's tracker update.

## 6. Tests

```bash
php artisan test          # or: vendor/bin/pest
vendor/bin/pint --test    # style
```

Coverage highlights: cross-tenant isolation, RBAC per role, the full menu-upload lifecycle
(`processing → parsed / needs_review / failed`), LLM happy-path / malformed-JSON / upstream-error,
the order lifecycle state machine, and Stripe signature + duplicate-webhook handling. All external
calls (LLM, OCR, Stripe, broadcasting) are faked in tests.

## 7. What I'd do with more time

- Swap the polling fallback in the kitchen/tracker UIs for a real Reverb (Laravel Echo) subscription.
- Inventory / "86'd item" tracking with automatic re-enable.
- Multi-language menus (translate at parse time).
- Kitchen ticket printer integration (ESC/POS).
- Per-order payment option alongside the subscription model.
- Move menu images to S3 and OCR to Google Cloud Vision (the interfaces already allow it).
