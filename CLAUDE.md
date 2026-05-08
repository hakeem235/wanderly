# CLAUDE.md — Wanderly Build Prompt

> Paste this file into the root of a new repo, then run Claude Code from that directory. Or paste sections directly into Claude Code as you go. This file is the durable contract — every coding session should re-read it.

---

## 0. Mission

You are scaffolding **Wanderly**, a SaaS travel platform that does three things:

1. **Manages trips** — every flight, hotel, and activity in one timeline, importable from confirmation emails.
2. **Searches and books** — flights/hotels/activities aggregated across 4–6 providers with a unified booking flow.
3. **Plans with AI** — a Claude tool-using agent that builds day-by-day itineraries grounded in real, bookable inventory.

**Target user:** thoughtful travelers who today juggle TripIt + Booking + ChatGPT + Gmail. KSA / GCC first, then global.

**Design direction:** editorial travel-magazine, not enterprise SaaS. Warmth and craft over density and chrome. Treat trips as artifacts worth keeping.

You are working with **Ahmed** (QA/automation background, comfortable with Next.js, Mongoose, MongoDB, Redis, n8n, Docker, Claude API). Default to mainstream, well-documented choices. No exotic frameworks.

---

## 1. Tech Stack — Non-negotiable

```
Frontend:        Next.js 14 (App Router) + TypeScript (strict) + Tailwind v3 + shadcn/ui
Backend (web):   Next.js Route Handlers + Mongoose 8
Backend (search): Go 1.22 + chi router (separate service)
Database:        MongoDB 7 (app data) + PostgreSQL 16 (n8n only)
Cache:           Redis 7
Search index:    Typesense
AI:              Anthropic SDK (Claude Sonnet 4 — model id: claude-sonnet-4-20250514)
Payments:        Stripe (Subscriptions + PaymentIntents + Connect)
Email:           Resend + React Email
Workflows:       n8n (self-hosted, backed by Postgres)
Maps:            Mapbox GL JS
Auth:            Clerk (@clerk/nextjs v6) — email/password, OAuth, passkeys
Validation:      Zod (everywhere — never trust unvalidated JSON)
Observability:   OpenTelemetry → Grafana Cloud
Errors:          Sentry
CI/CD:           GitHub Actions → Fly.io (web + Go) + MongoDB Atlas (prod) + Upstash (Redis)
Package mgr:     pnpm (workspaces)
Node:            20 LTS
```

If you think a different choice is better, **flag it as a question** — do not silently substitute.

---

## 2. Repo Structure

```
wanderly/
├── apps/
│   ├── web/                    # Next.js 14 app — user-facing
│   ├── search/                 # Go microservice — provider aggregation
│   └── workers/                # n8n workflows + scheduled jobs (TS)
├── packages/
│   ├── db/                     # Mongoose models + seed (no migrations — schemaless)
│   ├── sdk/                    # Generated TS client (OpenAPI → ts-rest or zodios)
│   ├── ui/                     # shadcn/ui re-exports + Wanderly tokens
│   ├── ai/                     # Claude agent runtime + tool definitions
│   ├── providers/              # Shared provider adapter types (TS)
│   └── config/                 # Shared eslint, tsconfig, tailwind preset
├── infra/
│   ├── docker-compose.yml      # local dev: mongo, postgres (n8n), redis, typesense, n8n
│   ├── fly/                    # fly.toml per app
│   └── github/                 # actions
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── adrs/                   # architecture decision records
├── CLAUDE.md                   # this file
├── package.json
├── pnpm-workspace.yaml
└── turbo.json                  # for parallel builds
```

---

## 3. Build Phases — Ship in this order

Do not skip ahead. Each phase ships to a deployed preview environment before the next starts.

### Phase 1 — Foundation (Days 1–4) ✅ COMPLETE

- [x] Init monorepo, pnpm workspaces, turbo, shared eslint/tsconfig
- [x] Docker compose for local dev (MongoDB 7, Postgres 16 for n8n, Redis 7, Typesense, n8n)
- [x] `packages/db` — Mongoose models (see §5), seed script
- [x] `apps/web` — Next.js 14 scaffold, App Router, Tailwind, shadcn/ui installed
- [x] Clerk v6 auth — email/password + OAuth, middleware-protected routes, UserButton in nav
- [x] Design tokens from `docs/DESIGN.md` wired into Tailwind config
- [x] Base layout: app shell with nav, logo, search, avatar (per Screen 02 in design system)
- [x] One protected route renders user's email — proves auth round trip works
- [x] GitHub Actions removed (CI deferred — no deploy target yet)
- [x] Fly.io config removed — deploy deferred to later phase

**DoD:** ✅ Sign up, log in via Clerk, see dashboard at `localhost:3000/dashboard`.

### Phase 2 — Trip CRUD + Manual Entry (Days 5–9) ✅ COMPLETE

- [x] Trip create / read / update / delete (server actions)
- [x] Segment polymorphic CRUD — flights, lodging, activities, transfers, notes
- [x] Trip dashboard (Screen 02) — greeting, stats, trip cards
- [x] Trip detail page (Screen 03) — hero, day rail, timeline, budget + map placeholder
- [x] Mobile responsive — PWA manifest + icons (192px, 512px), apple-web-app meta
- [x] Trip sharing — share link with token, read-only viewer route (`/share/[token]`)
- [x] OpenTelemetry traces on every server action (`@vercel/otel` + `withSpan()` helper)
- [x] Marketing landing page — hero, how-it-works, features, FAQ, CTA, footer
- [x] Clerk sign-in/up page styled with brand variables (terracotta, cream, ink tokens)

**Known bugs fixed in this phase:**
- Mongoose stale promise: `_mongoosePromise` held resolved promise after connection drop → reset on readyState 0/3
- Clerk middleware: `auth.protect()` doesn't server-redirect in dev → replaced with explicit `NextResponse.redirect()`
- Empty `app/dashboard/` directory shadowing `(app)/dashboard/page.tsx` → removed
- `Types.ObjectId` minified by webpack → use `Schema.Types.ObjectId` everywhere
- `localhost` resolves to IPv6 in Node 24, Docker binds IPv4 → use `127.0.0.1` in `MONGODB_URI`

**DoD:** ✅ Created "Tokyo Aug 2026", added segments, shared link works, installable as PWA.

### Phase 3 — Email Import (Days 10–12)

- [ ] Resend inbound webhook receiver — `forward+TRIP_ID@import.wanderly.co`
- [ ] Email parser: hybrid regex (for known senders: Booking, airlines) + Claude fallback for unknown formats
- [ ] Document upload to R2 (or S3) for confirmations
- [ ] Auto-create segments from parsed emails, attach original email + PDFs as documents
- [ ] Test fixtures: 10 sample confirmation emails (anonymized) covering Booking, Saudia, Emirates, Airbnb, Viator

**DoD:** I forward a Booking.com confirmation email to my trip address, the segment appears within 30 seconds.

### Phase 4 — Flight + Hotel Search (Days 13–18)

- [ ] `apps/search` — Go service skeleton with chi, structured logging (zap), OTel
- [ ] Provider interface (see §6) + Amadeus adapter (sandbox)
- [ ] Aggregator with concurrent fan-out, Redis cache, deduplication, ranking
- [ ] OpenAPI spec for search endpoints + generated TS client
- [ ] Search UI in web app (Screen 05) — filter rail, results list, "BEST VALUE" callout
- [ ] Save quote to trip as a draft segment (not booked yet)

**DoD:** Search RUH→HND for Aug 12, see ≥10 results from Amadeus sandbox, save a quote to my Tokyo trip.

### Phase 5 — Booking + Stripe (Days 19–24)

- [ ] Booking endpoint with idempotency key (Redis-backed, 24h TTL)
- [ ] Stripe Connect onboarding for the platform account
- [ ] PaymentIntent creation, 3DS handling, webhook reconciliation
- [ ] Confirm-with-provider step (Amadeus order create)
- [ ] Booking state machine — `QUOTED → PENDING → CONFIRMED | FAILED | CANCELLED` (only forward transitions)
- [ ] Failure recovery (see §7 — every failure mode handled)
- [ ] Checkout UI (Screen 06) — travelers form, contact, payment, order summary
- [ ] Confirmation email via Resend with PDF e-ticket attached

**DoD:** Book the Saudia flight in test mode, get a confirmation PNR, receive email with attached e-ticket. Force every failure mode in test and verify clean recovery.

### Phase 6 — AI Itinerary Agent (Days 25–30)

- [ ] `packages/ai` — agent runtime, tool definitions, conversation state (MongoDB)
- [ ] Tools (see §8): `search_flights`, `search_hotels`, `search_activities`, `get_destination_info`, `save_itinerary`
- [ ] System prompt enforces grounding rules (no inventory hallucination)
- [ ] SSE-streamed planning UI (Screen 04) — tool calls visible, generated plan rendering live
- [ ] Pro plan gating via Stripe Subscriptions (free tier: 3 trips, manual entry only)
- [ ] Cost guardrails: max 12 tool calls per session, hard token cap

**DoD:** "Plan a 5-day food trip to Bangkok in October, ~$1,800" → returns a saveable day-by-day itinerary backed by real provider quotes within 60 seconds.

### Phase 7 — Polish + Soft Launch (Days 31–36)

- [ ] Mobile PWA pass — installable, offline trip viewing, push notifications via Web Push
- [ ] Multi-currency display (settle in USD, display in user locale)
- [ ] i18n with next-intl, English + Arabic, RTL tested
- [ ] Price-drop alerts via n8n workflow (poll saved quotes daily, email on >5% drop)
- [ ] Seed content: top 20 destinations with photos, weather, visa info
- [ ] Status page (Statuspage or self-hosted Cachet)
- [ ] Closed beta launch — 200 invite codes

**DoD:** A real beta user goes through end-to-end signup → plan → book → trip view, all without bugs blocking flow.

---

## 4. Design System — Match this exactly

Wire these tokens into `packages/config/tailwind-preset.ts`. Reference `docs/DESIGN.md` for the full spec.

```ts
// Color tokens
export const colors = {
  ink:           '#15191F',
  'ink-soft':    '#2A2F38',
  'ink-mute':    '#5C6470',
  paper:         '#F5EFE3',
  'paper-warm':  '#EFE6D4',
  'paper-deep':  '#E8DEC9',
  cream:         '#FAF6EC',
  terracotta:    '#B85C38',
  'terracotta-deep': '#8E3F22',
  teal:          '#1F4F4A',
  'teal-deep':   '#0F312E',
  sage:          '#88947B',
  gold:          '#C9A24B',
  rust:          '#D6856B',
  line:          '#D8CCB3',
  'line-soft':   '#E5DCC8',
};

// Typography — load via next/font
//   display: Fraunces (variable, opsz 9-144)
//   body:    DM Sans
//   mono:    JetBrains Mono
```

**Brand rules (enforce in PR review):**

- Terracotta is the **only** primary accent. Never pair with another accent on the same surface.
- Italics on display headlines for emphasis words ("Tokyo", "actually", "plan it") — this is a brand signature.
- Dashed lines for routes, dividers between segments, boarding-pass motifs — recurring visual element.
- Use topographic SVG patterns instead of stock photos for trip card hero areas.
- All status badges use uppercase JetBrains Mono with 0.15–0.2em letter-spacing.
- AI is a "concierge", not a "chatbot" — copy reflects this. No "Hi! I'm your AI assistant" energy.

---

## 5. Database — Mongoose Models

All models live in `packages/db/src/models/`. No migrations — MongoDB is schemaless; Mongoose enforces shape at the app layer. Run `pnpm db:seed` to populate dev data.

### Connection

```ts
// packages/db/src/index.ts
export async function connectDB(): Promise<typeof mongoose>
// Note: no clientPromise — Auth.js removed, Clerk handles auth outside Mongoose
```

### Environment variable

```
MONGODB_URI="mongodb://wanderly:wanderly@127.0.0.1:27017/wanderly?authSource=admin"
# Use 127.0.0.1, NOT localhost — Node 24 resolves localhost as IPv6 (::1)
# but Docker binds MongoDB on IPv4 only.
```

### Models summary

| Model | Key fields | Notes |
|---|---|---|
| `User` | email, name, locale, emailVerified | Clerk owns identity; this model is for app-level profile data |
| `Trip` | ownerId, title, destination, startDate, endDate, status, budgetCents, currency | status: PLANNING \| BOOKED \| ONGOING \| COMPLETED \| CANCELLED |
| `Segment` | tripId, type, startsAt, endsAt, title, payload, bookingId, orderHint | type: FLIGHT \| LODGING \| ACTIVITY \| TRANSFER \| FOOD \| NOTE; payload validated by Zod |
| `Booking` | userId, tripId, provider, providerRef, status, totalCents, currency, idempotencyKey | status: QUOTED \| PENDING \| CONFIRMED \| CANCELLED \| FAILED |
| `Subscription` | userId, stripeCustomerId, stripeSubId, plan | plan: FREE \| PRO \| TEAM |
| `TripShare` | tripId, token, role, expiresAt | role: VIEWER \| EDITOR |
| `Traveler` | tripId, firstName, lastName, passportNum | passportNum encrypted at app layer |
| `Document` | tripId, type, s3Key, filename, parsed | type: PASSPORT \| VISA \| TICKET \| RECEIPT \| OTHER |
| `Passkey` | userId, credentialId, publicKey, counter, deviceType | credentialId stored as Buffer |

### Calling connectDB

Call `await connectDB()` at the top of every Server Action and Route Handler before using any Mongoose model. In dev, the connection is cached on `globalThis` to survive HMR.

---

## 6. Provider Adapter Interface (Go)

In `apps/search/internal/providers/provider.go`:

```go
package providers

import (
    "context"
    "encoding/json"
    "time"
)

type FlightQuery struct {
    Origin      string    // IATA
    Destination string
    Depart      time.Time
    Return      *time.Time
    PaxAdult    int
    PaxChild    int
    Cabin       string    // economy | premium | business | first
}

type Slice struct {
    Origin      string
    Destination string
    Depart      time.Time
    Arrive      time.Time
    Carrier     string
    FlightNum   string
    Stops       []string
}

type Offer struct {
    ID         string
    Provider   string
    TotalCents int
    Currency   string
    Slices     []Slice
    Baggage    BaggageRules
    Refundable bool
    ExpiresAt  time.Time     // CRITICAL — offers expire
    Raw        json.RawMessage
}

type BaggageRules struct {
    CarryOn int
    Checked int
    KgIncluded int
}

type Provider interface {
    Name() string
    SearchFlights(ctx context.Context, q FlightQuery) ([]Offer, error)
    QuoteOffer(ctx context.Context, offerID string) (*Offer, error)
    Confirm(ctx context.Context, offerID string, pax []Passenger, payment PaymentRef) (*ConfirmedBooking, error)
    Cancel(ctx context.Context, bookingRef string) error
}
```

Adapters live in `apps/search/internal/providers/{amadeus,duffel,booking,ratehawk}/`. Each has its own package, its own integration tests with VCR-style fixtures, and a feature flag in config so it can be disabled live.

---

## 7. Booking Flow — Failure modes (must handle all)

Every one of these has to be tested with a forced-failure integration test:

| Failure | Detection | Recovery |
|---|---|---|
| Offer expired before confirm | Provider returns `OFFER_EXPIRED` | Re-quote silently. If new price within 5% delta, auto-confirm. Else surface to user with "Price changed: re-confirm?" |
| Stripe charge succeeds, provider confirm fails | Confirm step throws after PI captured | Auto-refund via Stripe. Mark booking `FAILED`. Email user. **Never** leave money in limbo. |
| Stripe charge fails, provider held inventory | PI fails; provider hold may be active | Cancel provider hold immediately. User retries with different card. |
| Webhook arrives before sync confirm response | Race condition | Idempotent state machine — only forward transitions allowed. Out-of-order events drop with logged warning. |
| User double-clicks "Book" | Two POSTs with same Idempotency-Key | Second request returns first request's response from Redis cache. |
| Provider 5xx during confirm | HTTP error after PI captured | Retry confirm with exponential backoff (3 attempts). If still fails, refund + manual review queue. |

---

## 8. AI Agent — Tools and System Prompt

In `packages/ai/src/tools.ts`:

```ts
export const tools: Anthropic.Tool[] = [
  {
    name: 'search_flights',
    description: 'Search flights between two cities. Returns ranked offers from real providers.',
    input_schema: {
      type: 'object',
      required: ['origin', 'destination', 'departDate'],
      properties: {
        origin:      { type: 'string', description: 'City or IATA code' },
        destination: { type: 'string', description: 'City or IATA code' },
        departDate:  { type: 'string', format: 'date' },
        returnDate:  { type: 'string', format: 'date' },
        paxAdult:    { type: 'integer', default: 1 },
        cabin:       { type: 'string', enum: ['economy', 'premium', 'business', 'first'] },
      },
    },
  },
  // search_hotels, search_activities, get_destination_info, save_itinerary
  // ... follow same shape as the public API
];
```

System prompt (verbatim — do not soften):

```
You are an itinerary planning agent for Wanderly. Your job is to build a
day-by-day itinerary for a user given their brief.

Rules:
1. ALWAYS call search_* tools before recommending anything. NEVER invent
   flights, hotels, or activities from memory.
2. Respect the user's budget. Track running cost; if a recommendation would
   push total over budget, downgrade an earlier item or flag the conflict.
3. Build coherent geography: don't put two activities 4 hours apart on the
   same morning. Cluster by neighborhood.
4. Per day: (1) lodging anchor, (2) 1–3 activities, (3) at most one travel-day
   note. Leave breathing room — over-planning ruins trips.
5. When done, call save_itinerary with structured plan. Do NOT just print it.
6. If the brief is contradictory ("luxury Tokyo trip for $300"), surface it
   and ask for guidance.

Cost discipline:
- Cache aggressively. Don't re-call search_flights unless dates/cities changed.
- Limit ~12 tool calls per session unless user explicitly asks for revisions.

Output style:
- Final reply: short summary (3–5 sentences). Itinerary is rendered by UI
  from save_itinerary's payload — do not duplicate it in prose.
```

Hard limits to enforce in code (not prompt):
- Max 12 tool calls per conversation turn
- Max 200k input tokens, 8k output tokens per request
- Total budget: $0.30 per planning session (track in `agent_session` collection in MongoDB)

---

## 9. Conventions

### Code style
- TypeScript strict, no `any`, no `@ts-ignore` without comment explaining why
- Server actions for mutations from RSC; REST/OpenAPI for cross-service calls
- Zod schema for every external input — request bodies, env vars, provider responses
- All money is `Cents: number` and `currency: string`. Never `number` for currency. Never floats.
- All times are `Date` in TypeScript, `time.Time` in Go. Always store UTC. Display in user locale.
- Errors return RFC 7807 Problem Details JSON
- Always call `await connectDB()` before using Mongoose models in server context

### File naming
- `kebab-case` for files
- `PascalCase` for React components
- `camelCase` for functions and variables
- Test files alongside source as `*.test.ts` / `*_test.go`

### Commits
- Conventional Commits format: `feat(scope): subject`, `fix(scope): subject`, etc.
- One logical change per commit
- Reference the phase: `feat(trip): add segment CRUD [phase-2]`

### PRs
- Branch naming: `phase-N/short-description`
- Each PR includes: tests, OTel spans, screenshot if UI, ADR if it's an architectural choice
- Definition of Done in each PR description matches the phase DoD above

---

## 10. What NOT to do (in MVP)

If you find yourself wanting to do any of these, stop and ask:

- ❌ Cars, rail, ferry, cruise — defer to V2
- ❌ Native mobile apps — PWA is sufficient
- ❌ B2B / agency tier — defer
- ❌ Insurance, eSIMs, lounges — V3
- ❌ Kafka, microservices beyond search — overkill at this scale
- ❌ Custom design system from scratch — use shadcn/ui as base, override with brand tokens
- ❌ Switching auth providers again — Clerk v6 is the decision, it stays
- ❌ Vercel-only deployment — must run on Fly.io / Hetzner too
- ❌ ChatGPT-style open chat in the AI planner — constrain to planning task only
- ❌ SQL databases for app data — MongoDB is the decision, do not revert to Postgres for app models

---

## 11. Quality bar

A feature is **not done** until:

- ✅ Tests cover happy path + at least one failure mode
- ✅ OpenAPI spec updated (if endpoint added)
- ✅ TS client regenerated and committed
- ✅ OTel span on every new endpoint or background job
- ✅ Feature flag in place (LaunchDarkly or simple env-var-driven)
- ✅ Sentry tags include `phase`, `feature`, `userId` (hashed)
- ✅ Mobile responsive (test at 390px, 768px, 1440px)
- ✅ Accessible: keyboard navigable, AA contrast, semantic HTML, aria where needed
- ✅ Loom video (or animated GIF) attached to PR for any user-facing change

---

## 12. Current state — pick up here

Phases 1 and 2 are complete. When resuming work:

1. Read this file end-to-end.
2. Run `docker compose -f infra/docker-compose.yml up -d` to start local services.
3. Run `pnpm --filter @wanderly/web dev` to start the web app (port 3000).
4. The next phase is **Phase 3 — Email Import**.

**Auth note:** We migrated from Auth.js to Clerk v6 mid-Phase 1. All auth code uses `@clerk/nextjs/server`. The `auth()` helper returns `{ userId }` (a Clerk user ID string, not a MongoDB ObjectId). Server actions must check `if (!userId) redirect("/login")` — do not use `notFound()` as the auth guard.

**Mongoose note:** Always use `127.0.0.1` (not `localhost`) in `MONGODB_URI`. After calling `connectDB()`, check that `mongoose.connection.readyState === 1` if you suspect a stale connection. The `connectDB()` function resets its internal promise on readyState 0 or 3 before reconnecting.

**Do not** try to scaffold multiple phases at once. Each phase ships and is reviewed before the next starts.

---

## 13. References

- Architecture document: `docs/ARCHITECTURE.md` (the full PDF spec — data models, sequence diagrams, sprint plan, cost model)
- Design system: `docs/DESIGN.md` (the HTML showcase — brand, tokens, all 9 screens)
- ADR template: `docs/adrs/0000-template.md`

When in doubt, the architecture doc is the source of truth for *what* to build, and the design system is the source of truth for *how it looks*. This file (CLAUDE.md) is the source of truth for *how we work*.

---

*Wanderly — Architecture & Build Plan v1.2 · For Ahmed · 2026 · Phases 1–2 complete*
