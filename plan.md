# PLAN.md — SnapMenu AI
### AI-Powered Digital Menu & Ordering Platform for Restaurants/Cafes
**For: Claude Code implementation**
**Target: 1-YOE-level portfolio project, resume/interview-ready, real-user-attractive**

---

## 0. Instructions for Claude (read this first)

Build this project incrementally, in the phase order below. Do not skip ahead to AI/OCR or real-time features until Phase 1–3 (auth, tenancy, menu CRUD, queue plumbing) are fully working and tested. After each phase, run tests and confirm it works before moving on. Use Laravel best practices throughout: Service classes for business logic, Form Requests for validation, API Resources for response shaping, thin controllers, and global scopes for tenant isolation. Write Pest tests alongside each phase, not at the end. Currently no Docker — use SQLite for local dev and `QUEUE_CONNECTION=database` until Docker/Sail is available, then swap to MySQL/Redis via `.env` with no code changes.

---

## 1. Project Identity

- **Name:** SnapMenu AI
- **One-liner:** A restaurant owner photographs their paper menu, AI turns it into a beautiful digital menu with a QR code in seconds, and customers order directly from their table — orders flow live to a kitchen dashboard.
- **Two-sided product:** (1) **Owner Dashboard** — upload/manage menu, view live orders, analytics. (2) **Customer Ordering App** — scan QR, browse menu, place order, track status.
- **Resume framing (write this after completion):**
  > "Built SnapMenu AI, a multi-tenant SaaS platform (Laravel, MySQL, React) that converts photographed restaurant menus into digital ordering experiences via an AI/OCR pipeline, with real-time order broadcasting (Laravel Reverb), QR-based customer ordering, and a kitchen dashboard — architected with tenant data isolation, queued async processing, and idempotent payment handling."

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11, PHP 8.3 |
| Database | SQLite (local dev) → MySQL 8 (Sail/prod) |
| Auth | Laravel Sanctum |
| RBAC | spatie/laravel-permission (roles: Owner, Staff/Kitchen) |
| Queue | `database` driver (local) → Redis (prod via Sail) |
| OCR | Tesseract OCR (dev) / Google Cloud Vision (prod-ready path) |
| AI parsing | OpenAI/Anthropic/Gemini API (low-cost model) — image/text → structured menu JSON |
| Real-time | Laravel Reverb (or Pusher) — live order broadcasting to kitchen dashboard |
| Payments | Stripe (test mode) — subscription for restaurant OR per-order payment |
| QR Codes | `simplesoftwareio/simple-qrcode` package |
| Frontend | React + Vite + TypeScript + Tailwind (two apps: Owner Dashboard + Customer Ordering PWA) |
| Testing | Pest |
| Containerization | Laravel Sail (Docker) — added later when available |
| CI/CD | GitHub Actions |
| Monitoring | Laravel Horizon (queue dashboard), Laravel Telescope (dev debugging) |

---

## 3. Database Schema

```
users
  id, name, email, password, timestamps

restaurants   -- the "tenant"
  id, owner_user_id (FK), name, slug (unique, used in QR/menu URL),
  logo_path, primary_color, subscription_status ENUM('trial','active','cancelled'),
  timestamps

restaurant_staff   -- pivot: which users belong to which restaurant + role
  id, restaurant_id (FK), user_id (FK), timestamps
  -- role assigned via spatie, scoped per restaurant if using teams feature

menu_uploads
  id, restaurant_id (FK), file_path, status ENUM(
      'processing','parsed','needs_review','failed'
  ), raw_ocr_text (text, nullable), ai_confidence_score (float, nullable),
  processing_attempts (int, default 0), timestamps

menu_categories
  id, restaurant_id (FK), name, sort_order, timestamps
  -- e.g. "Starters", "Mains", "Drinks"

menu_items
  id, restaurant_id (FK), menu_category_id (FK, nullable),
  menu_upload_id (FK, nullable — traceability to source upload),
  name, description, price, currency, image_path (nullable),
  is_available (bool, default true), sort_order, timestamps

tables   -- physical restaurant tables, each gets its own QR code
  id, restaurant_id (FK), label (e.g. "Table 4"), qr_code_token (unique), timestamps

orders
  id, restaurant_id (FK), table_id (FK, nullable), customer_name (nullable),
  status ENUM('placed','confirmed','preparing','ready','served','cancelled'),
  total_amount, currency, timestamps

order_items
  id, order_id (FK), menu_item_id (FK), quantity, unit_price, notes (nullable), timestamps

payments
  id, order_id (FK, nullable) or restaurant_id (FK, for subscriptions),
  stripe_payment_intent_id, amount, status ENUM('pending','succeeded','failed'),
  idempotency_key (unique), paid_at, timestamps

roles / permissions / model_has_roles   -- via spatie package

webhook_events
  id, provider, event_id (unique — idempotency), payload (json), processed_at, timestamps
```

---

## 4. Build Phases

### Phase 1 — Foundation (Day 1)
- `composer create-project laravel/laravel snapmenu-ai`
- SQLite for local dev (`touch database/database.sqlite`, set `DB_CONNECTION=sqlite` in `.env`)
- Install Sanctum, spatie/laravel-permission
- Seed roles: `Owner`, `Staff`
- Auth endpoints: register, login, logout, me
- **Done when:** can register a restaurant owner and log in via Postman, valid Sanctum token returned

### Phase 2 — Multi-Tenancy + Menu CRUD (Day 2–4)
- `Restaurant` model — created on owner signup, with unique `slug`
- Global scope pattern: every menu/order/table query automatically scoped to the authenticated user's restaurant (critical — this is the multi-tenancy story you'll explain in interviews)
- `MenuCategory` and `MenuItem` models — full manual CRUD first (no AI yet)
- RBAC: `Owner` can manage staff/menu/settings; `Staff` can view orders and update order status only
- Feature tests: tenant isolation (User A cannot see/edit Restaurant B's menu items — write this test explicitly, it's a strong signal test), RBAC per role
- **Done when:** an owner can fully manage a menu manually, and cross-tenant access is proven blocked by tests

### Phase 3 — Queue Infrastructure + QR Codes (Day 5–6)
- `Table` model — generate a unique `qr_code_token` per table, render QR code (via `simplesoftwareio/simple-qrcode`) pointing to `/menu/{restaurant_slug}/{table_token}`
- `ProcessMenuUpload` job — **stub first**: `sleep(3)`, mark `status = parsed`
- `QUEUE_CONNECTION=database`, run `php artisan queue:table && php artisan migrate`
- Add retry policy: max 3 attempts, `processing_attempts` tracked, fail gracefully to `status = failed`
- **Done when:** uploading a menu image dispatches a job that completes/fails correctly; scanning a generated QR (manually opening the URL) resolves to the correct restaurant+table

### Phase 4 — AI/OCR Menu Parsing Pipeline (Day 7–9) — the differentiator
- Inside `ProcessMenuUpload`: run OCR on the uploaded menu photo to extract raw text
- Send raw text to LLM API with a strict system prompt requiring JSON-only output:
  - Structure: array of `{category, name, description, price}`
- **Defensive parsing:** validate JSON structure and types before saving; malformed/low-confidence results → `status = needs_review` with items staged for manual approval, never silently corrupt the menu
- Confidence scoring: derive from how many items had complete, well-typed fields
- Retry-with-backoff for transient AI API failures
- Build the **review UI flow**: parsed items shown as an editable list (category, name, price, description) with a confidence badge per item; owner bulk-approves or edits before items go live
- Feature tests: mock the LLM HTTP client — happy path, malformed JSON, timeout scenario
- **Done when:** uploading a real photographed menu produces an accurate, editable digital menu within seconds, with graceful degradation on bad input

### Phase 5 — Customer Ordering Flow (Day 10–12)
- Public (no-auth) customer endpoints: `GET /api/menu/{slug}` (view live menu for a restaurant), `POST /api/orders` (place an order tied to a table token)
- `Order` + `OrderItem` creation flow with validation (item must belong to restaurant, must be `is_available`)
- Order status state machine: `placed → confirmed → preparing → ready → served` (or `cancelled`)
- **Done when:** a customer can scan a QR (open the URL), browse the live menu, and place an order that lands in the database correctly

### Phase 6 — Real-Time Kitchen Dashboard (Day 13–14)
- Laravel Reverb (or Pusher) broadcasting: fire `OrderPlaced` event on new orders, `OrderStatusUpdated` on status changes
- Staff-facing kitchen dashboard subscribes to the restaurant's private channel — new orders appear **instantly**, no polling
- This is your single best demo moment: place an order from one browser tab (as "customer"), watch it appear live in another tab (as "kitchen") — record this for your portfolio video
- **Done when:** order placement and status changes reflect live across tabs/devices with no refresh

### Phase 7 — Payments (Day 15–16)
- Stripe test-mode integration — pick one model and implement fully:
  - **Subscription model:** restaurant owner pays a monthly fee for the platform (simpler, SaaS-style story)
  - **Per-order payment:** customer pays at order time (more complex, closer to real restaurant tech)
- Webhook endpoint with **signature verification** and **idempotency handling** (store `event_id`, reject duplicate deliveries) — explicitly call this out as a production concern in your README/interview notes
- Feature tests: signature validation, duplicate webhook ignored, status transitions correctly

### Phase 8 — Frontend (Day 17–21)
- **Owner Dashboard** (React + Vite + TS + Tailwind): menu upload with drag-and-drop, review/approve parsed items, table/QR management, live orders dashboard, basic analytics (top-selling items, revenue by day — use Recharts)
- **Customer Ordering App** (separate lightweight React PWA, mobile-first, no login required): QR-landing page → menu browse (nice food-forward visual design, categories as tabs) → cart → place order → live order status tracker
- This two-app split is a strong architectural talking point: "I built two distinct frontends against one API, one for a business owner, one for anonymous consumer use, with different auth models."

### Phase 9 — Polish & Deployment (Day 22–24)
- GitHub Actions: lint (Pint) → test (Pest) → build
- Deploy: Railway/Render, Supervisor-managed queue worker, Reverb server running
- Seed 1–2 demo restaurants with real-looking menus so recruiters can scan a QR code (printed on a business card or shown on your resume/LinkedIn!) and try it live
- Record a 60–90 second demo video showing: photo upload → AI parse → QR scan → order → live kitchen update
- Strong README: problem statement, architecture diagram, technical decisions, screenshots/GIF, live demo link + QR code image

---

## 5. Advanced Features (pick 3–4 to build deeply, don't try all of them)

1. **Tenant data isolation via global scopes** — the multi-tenancy story, provable with a specific test.
2. **Confidence-based human-in-the-loop menu review** — never trust AI blindly; a strong, explainable design decision.
3. **Real-time order broadcasting** (Reverb) — the single most impressive live-demo feature; interviewers can watch it work in real time on a call.
4. **Idempotent payment webhook handling** — cheap to add, high production-maturity signal.
5. **QR-token-based anonymous customer access** — no login needed for customers, but still scoped/secure per table — a distinct, defensible auth design decision.
6. **Order status state machine** — enforce valid transitions only (e.g., can't go from `placed` directly to `served`), a clean use of an enum + service-layer guard logic.
7. **Queue monitoring via Horizon** (once on Sail) — visual, demo-able ops maturity.

---

## 6. Testing Strategy

- Unit tests: Service classes (MenuUploadService, OrderService, AI response validator, QR token generator)
- Feature tests: full request/response cycles per role, **explicit cross-tenant isolation test** (this one test is worth calling out by name in interviews)
- Mock all external calls (LLM API, OCR, Stripe, broadcasting) in CI — never hit real services in tests
- Target: full coverage on the order lifecycle state machine and the menu upload lifecycle (processing → parsed/needs_review → live)

---

## 7. README Structure (write this last)

1. Problem statement (1 paragraph — the paper-menu/QR pain point)
2. Architecture diagram (two frontends, one API, queue worker, broadcast server)
3. Key technical decisions & trade-offs (multi-tenancy via global scopes, confidence-based AI review, real-time broadcasting, idempotent webhooks — one paragraph each)
4. Tech stack table
5. Screenshots / demo GIF (menu upload → parse → QR scan → live order)
6. Local setup instructions
7. Live demo link + QR code image (let people actually try it)
8. "What I'd do with more time" section (e.g., inventory/86'd-item tracking, multi-language menus, printer integration for kitchen tickets)

---

## 8. Definition of Done (for resume-readiness)

- [ ] All 9 phases complete and deployed live with a working demo restaurant + scannable QR code
- [ ] Meaningful test coverage including the tenant-isolation test, CI pipeline green
- [ ] 3–4 advanced features fully implemented and explainable unscripted
- [ ] README with architecture diagram and a recorded demo video/GIF
- [ ] Can answer without hesitating: "How do you isolate one restaurant's data from another?" "What happens if the AI misreads a menu?" "How does the kitchen dashboard get orders without polling?" "How do you handle a duplicate payment webhook?"
- [ ] At least one real person (friend, local shop, classmate) has actually scanned the QR and placed a test order — this is what turns "portfolio project" into "I built something people used"