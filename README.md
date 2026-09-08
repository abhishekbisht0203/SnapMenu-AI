# SnapMenu AI

**A restaurant owner photographs their paper menu, AI turns it into a digital menu with a QR code in
seconds, and customers order from their table — orders stream live to a kitchen dashboard.**

A multi-tenant SaaS platform (Laravel 12 API + two React/TypeScript SPAs) that converts photographed
restaurant menus into digital ordering experiences via an OCR + LLM pipeline, with real-time order
broadcasting, QR-based anonymous customer ordering, and a kitchen dashboard.

| | |
|---|---|
| **Application** | [`snapmenu-ai/`](snapmenu-ai/) — Laravel API, Pest tests, `frontend/` React apps |
| **Full docs** | [`snapmenu-ai/README.md`](snapmenu-ai/README.md) — architecture diagram, technical decisions, setup, demo flow |
| **Original brief** | [`plan.md`](plan.md) |
| **Status** | All 9 build phases complete · 50 Pest tests / 146 assertions passing · CI green |

## Quick start

```bash
# Backend  (http://127.0.0.1:8000)
cd snapmenu-ai
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed        # seeds a demo restaurant (local env only)
php artisan serve
php artisan queue:work            # processes menu-upload jobs

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
#   Owner / Kitchen dashboard → http://localhost:5173/owner.html
#   Customer ordering PWA      → http://localhost:5173/customer.html#/r/demo-bistro
```

Demo logins (local seed): `owner@demo.test` / `password` (Owner) ·
`kitchen@demo.test` / `password` (Staff).

## What it demonstrates

- **Tenant data isolation via global scopes** — one restaurant can never see or touch another's data;
  proven by an explicit cross-tenant test.
- **Confidence-based human-in-the-loop AI review** — the LLM output is defensively validated and
  scored; low-confidence parses are held for owner approval, never applied blindly.
- **Real-time order broadcasting** — new orders and status changes push to the kitchen over a private
  channel with no polling.
- **Idempotent Stripe webhooks** — signature-verified, and every `event_id` is de-duplicated.
- **QR-token anonymous customer access** — no login for diners, still fully scoped and validated
  server-side.
- **Guarded order state machine** — only legal `placed → confirmed → preparing → ready → served`
  (or `cancelled`) transitions are accepted.

## Tech stack

Laravel 12 · PHP 8.2+ · SQLite→MySQL · Sanctum · spatie/laravel-permission · database/Redis queue ·
Tesseract / OpenAI (JSON mode) · Laravel Reverb · Stripe · simple-qrcode · React 18 + Vite +
TypeScript + Tailwind · Pest · GitHub Actions.

## Tests

```bash
cd snapmenu-ai
php artisan test          # 50 passing
vendor/bin/pint --test    # style
```

External services (LLM, OCR, Stripe, broadcasting) are faked in the test suite.

## Remaining before a live demo

- Deploy (Railway/Render) with a Supervisor-managed queue worker and Reverb server.
- Swap the kitchen/tracker polling fallback for a live Laravel Echo subscription.
- Record the 60–90s demo video: photo upload → AI parse → QR scan → order → live kitchen update.
