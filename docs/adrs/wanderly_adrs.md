# Architecture Decision Records — Wanderly

> Drop these into `docs/adrs/` in your repo. Each ADR is a permanent record of a decision and its trade-offs. Update the status if a decision is later superseded — never delete.

---

## How to use this folder

1. Copy `0000-template.md` when making a new architectural decision
2. Number sequentially (`0006-...`, `0007-...`)
3. Status starts as `Proposed`. Move to `Accepted` after team review (or solo: after sleeping on it)
4. If a later ADR replaces an earlier one, mark the old one `Superseded by ADR-NNNN`
5. Reference ADRs in PRs: *"See ADR-0003 for why we use Auth.js"*

---

# 0000 — ADR Template

```markdown
# ADR-NNNN: <Title>

**Status:** Proposed | Accepted | Superseded by ADR-NNNN | Deprecated
**Date:** YYYY-MM-DD
**Deciders:** Ahmed
**Tags:** infra | data | security | ai | etc.

## Context

What is the situation that requires a decision? What constraints apply
(time, budget, team skills, existing systems)? What's the forcing function?

## Decision

What did we decide? State it crisply in one or two sentences first, then
elaborate.

## Consequences

### Positive
- ...

### Negative
- ...

### Neutral / Notes
- ...

## Alternatives Considered

### Alt A: <name>
Why considered, why rejected.

### Alt B: <name>
Why considered, why rejected.

## References
- Link to architecture doc section
- Link to vendor docs
```

---

# ADR-0001: Modular monolith with a dedicated Go search service

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Ahmed
**Tags:** infra · architecture

## Context

Wanderly has three workloads with very different characteristics:

1. **CRUD / user-facing** — trip management, dashboards, auth. Latency-tolerant, request rates moderate, benefits from rich type sharing between client and server.
2. **Provider aggregation** — fan out to 4–6 travel APIs per search query. Each provider has 2–8s latency. The user perceives whichever is slowest. Concurrency-heavy, latency-critical, network-bound.
3. **AI itinerary planning** — long-running (20–60s), tool-calling, occasionally bursty. Token-cost sensitive.

A pure monolith forces us to use the wrong runtime for workload #2. Full microservices add operational burden disproportionate to a 1–2 person team.

## Decision

Use a **modular monolith in TypeScript/Next.js for the user-facing path**, plus **one dedicated Go microservice for search aggregation**. The AI agent runs in-process inside the Next.js app for now (extractable later if needed).

This is two services, not five. The split is justified by workload, not by trend.

## Consequences

### Positive
- Search service uses Go's native concurrency (goroutines + context cancellation) — ideal for fan-out with deadlines.
- Search container is tiny (~15MB), starts fast, predictable memory — keeps cloud bills in check.
- Web app stays in one TypeScript repo with shared types, fast iteration.
- Operational surface area is small: 2 services, not 5+.

### Negative
- Two languages — TypeScript and Go. Onboarding cost slightly higher.
- Need to maintain an OpenAPI contract between the two services + generate clients on both sides.
- Go ecosystem for travel-specific libraries is thinner than Node — some adapters will be hand-rolled.

### Neutral
- The AI agent could be extracted to its own service later if cost/latency justifies it. Don't pre-extract.

## Alternatives Considered

### Alt A: Pure Node.js monolith
Rejected. Node's worker-thread model and event loop work for moderate concurrency but show weaknesses at high fan-out with strict latency budgets. Cloud cost would be ~2–3× for the same throughput.

### Alt B: Full microservices (auth, trip, search, booking, AI, notification)
Rejected. Five services × deployment + observability + auth between services + on-call burden = unjustifiable for a team of 1–2 at MVP. We'd spend more time on infra than features.

### Alt C: Rust for the search service instead of Go
Rejected. Rust would be marginally faster but iteration speed matters more than raw performance at this stage. Go is "fast enough" and the team can ship Go code 2× faster than Rust.

## References
- Architecture doc, §4 "System Architecture"

---

# ADR-0002: PostgreSQL with JSONB for polymorphic segments

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Ahmed
**Tags:** data

## Context

A trip is a heterogeneous list of segments: flights, hotels, activities, transfers, food bookings, free-form notes. Each type has different fields:

- Flight: airline, flight number, IATA codes, depart/arrive times, baggage rules, PNR
- Hotel: property name, check-in/out, room type, confirmation number
- Activity: name, location, duration, price, supplier reference

We need to query the timeline efficiently (segments by trip, ordered by time) but the schema for each type is different.

## Decision

Use a single `Segment` table with a `type` enum and a `payload` JSONB column. The shape of `payload` is validated at the application layer with Zod schemas keyed off `type`. PostgreSQL with Prisma is the database.

Add a GIN index on `payload` for ad-hoc analytics queries.

## Consequences

### Positive
- One indexable timeline query, regardless of segment type.
- Schema migrations don't require touching multiple tables when a field is added to one segment type.
- Type safety preserved at the application layer via Zod-discriminated unions.
- Future segment types (cruise, rail, ferry) added by extending the enum + adding a Zod schema. No DB migration needed.

### Negative
- Cannot enforce field-level constraints in the database. Validation lives in app code.
- Querying inside JSONB is more verbose than relational equivalents.
- Reporting/BI tools that consume JSONB need flattening.

### Neutral
- If we later need strict relational queries on a specific segment type, we can materialize a view or sidecar table without schema migration pain.

## Alternatives Considered

### Alt A: Table per segment type (flights, lodgings, activities)
Rejected. Sprawling schema, painful joins for the timeline query, unclear ownership of "transfer" and "note" types.

### Alt B: Single-table inheritance with sparse columns
Rejected. Tables would have 30+ columns of which most rows use 5. Bad for both DX and storage.

### Alt C: MongoDB
Rejected. Trip data is fundamentally relational (trip → travelers → segments → bookings). Postgres + JSONB gives 90% of MongoDB's flexibility on the polymorphic axis without losing relational integrity on the rest.

## References
- Architecture doc, §6 "Data Model"

---

# ADR-0003: Auth.js v5 with Passkeys as the primary authentication

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Ahmed
**Tags:** auth · security

## Context

We need authentication that is:
- Secure by default (no password reuse risk)
- Low friction (travelers sign up on mobile, often)
- Affordable at any scale (no per-MAU pricing)
- Portable (no vendor lock-in)
- Compatible with our Postgres-first architecture

Passkeys (WebAuthn) are now well-supported across iOS, Android, macOS, Windows 11, and all major browsers. They eliminate password phishing entirely.

## Decision

**Auth.js v5** with the **Postgres adapter**. Primary auth method: **Passkeys**. Secondary: **email magic link** (for users on devices that don't yet have passkey support, or for cross-device login).

OAuth (Google/Apple) is **not** added in MVP — passkey + email covers 100% of users without the complexity of OAuth account linking.

## Consequences

### Positive
- No passwords to leak, hash, or rotate.
- Auth code lives in our repo and our database. Zero vendor risk.
- Passkeys feel magical on mobile (FaceID/TouchID one-tap login).
- Free at any scale.
- Auth.js is maintained, used by tens of thousands of Next.js apps.

### Negative
- Passkey UX has edge cases (device migration, account recovery). Need a documented recovery flow.
- Auth.js v5 has fewer Stack Overflow answers than v4 (it's recent). May need to dig into source occasionally.
- If a user loses all their passkey-capable devices and forgets their magic-link email, account recovery requires manual support.

### Neutral
- We can add OAuth later in 2 days of work if user research shows demand.

## Alternatives Considered

### Alt A: Clerk
Rejected. $25/mo + per-MAU costs at scale. Vendor lock-in. Saves engineering time short-term but pays forever.

### Alt B: Auth0
Rejected. More enterprise-focused; pricing escalates fast above 7,000 MAU.

### Alt C: Supabase Auth
Rejected. Couples us to Supabase as a platform. We've chosen Neon for Postgres.

### Alt D: Roll our own
Rejected. Building auth correctly (CSRF, sessions, brute-force protection, recovery) is multiple weeks. Auth.js gets it right.

## References
- Architecture doc, §13 "Security & Compliance"

---

# ADR-0004: Stripe Connect for marketplace payments and commission tracking

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Ahmed
**Tags:** payments · commerce

## Context

Wanderly's revenue has two streams:
1. **Subscription** (Pro plan, $9/mo) — straightforward Stripe Subscriptions
2. **Booking commissions** — when a user books through us, the provider pays us 3–8%. We charge the user the full amount, then settle with the provider.

Path #2 is more complex. Three options:

- **Direct charges** — user's card charged on Wanderly account; we pay provider via wire/ACH. Simple but exposes us to chargebacks for the full booking amount.
- **Destination charges** — Stripe Connect routes funds to a connected account, splitting commission automatically.
- **Net rates** — for some providers (RateHawk), we buy at a wholesale rate and add markup. We bear the full charge but don't pay commission separately.

Different providers will require different patterns.

## Decision

Use **Stripe** for both streams. Use **Stripe Connect with Custom accounts** for commission-style provider relationships (Amadeus, Booking Affiliate, Viator). Use **direct charges** for net-rate providers (RateHawk).

All money in the system is stored as `(amountCents: int, currency: string)`. Never floats.

## Consequences

### Positive
- One payment processor, one set of webhooks, one set of dashboards.
- Connect handles the regulatory complexity of being a payment facilitator.
- Connect supports 3DS, dispute handling, and tax (Stripe Tax) in one stack.
- Subscriptions and one-time charges share the same Customer object.

### Negative
- Connect onboarding for each provider is paperwork-heavy (KYC, business docs).
- Connect fees (~0.25% + $2 per payout) cut into margin slightly.
- Migrating to a different processor later is non-trivial.

### Neutral
- Likely need a finance engineer to consult once GMV crosses ~$500k/yr.

## Alternatives Considered

### Alt A: Stripe + Adyen
Rejected. Two processors = double integration, double dashboards, double failure modes. Overkill for MVP.

### Alt B: Direct charges only, settle with providers manually
Rejected. Manual settlement doesn't scale past 10–20 bookings/month and exposes us to full-amount chargebacks.

### Alt C: PayTabs / Tap Payments (regional)
Rejected for MVP. Lower fees in KSA but weaker SDKs, fewer connectors. Revisit if expanding to KSA-only operations and need local card preference.

## References
- Architecture doc, §11 "Booking Flow"

---

# ADR-0005: AI itinerary planning is a tool-using agent, not a chatbot

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Ahmed
**Tags:** ai · product

## Context

The AI planning feature could be implemented in several ways:

1. **Open chatbot** — user chats with Claude, gets a text itinerary
2. **Tool-using agent** — Claude is given a tightly-scoped task ("build itinerary"), calls real internal APIs, returns structured JSON the UI renders
3. **LLM-augmented templates** — pre-built itinerary templates with LLM filling in details

Each has different implications for groundedness, cost, UX, and scope.

## Decision

Build a **tool-using agent** with a constrained planning task. The agent is given:
- A clear start (user brief) and end (saved itinerary)
- A small set of tools (`search_flights`, `search_hotels`, `search_activities`, `get_destination_info`, `save_itinerary`)
- A strict system prompt that forbids inventing inventory
- Hard limits on tool calls (max 12) and tokens (max 200k input / 8k output) per session

The output is structured JSON (saved via `save_itinerary` tool) that the UI renders into the trip timeline. Free-text reply is a 3–5 sentence summary only.

## Consequences

### Positive
- **Grounded.** Every recommendation is backed by a real provider quote with an offer ID. No hallucinated flights.
- **Bookable.** The itinerary is one click from a booking flow because offer IDs persist.
- **Auditable.** Every tool call is logged; we can replay why each item ended up in the plan.
- **Cost-bounded.** Hard tool-call and token limits make cost-per-session predictable (~$0.10–$0.25). We can confidently gate behind Pro plan.
- **Defensible.** "ChatGPT can also plan a Tokyo trip" — yes, but Wanderly's plan is bookable. That's the moat.

### Negative
- More engineering than a thin chatbot wrapper.
- Tool-use reliability requires careful system prompt design + evals.
- Latency is 20–60s for a full plan. Mitigated with streaming UI.

### Neutral
- We can add a "revise this segment" chat affordance in V2 — doesn't require redesigning the agent, just reusing it with different starting context.

## Alternatives Considered

### Alt A: Open chatbot
Rejected. Encourages off-topic drift, jailbreaks, unbounded token costs. Output is text, not bookable. Differentiation against ChatGPT would be zero.

### Alt B: LLM-augmented templates
Rejected. Templates don't scale across the long tail of destinations. Would feel canned.

### Alt C: GPT-4o instead of Claude
Considered as a parallel option. Both are capable. We pick Claude as primary because Anthropic's tool-use reliability is currently best-in-class for agentic flows, and the long-context window helps when the agent reasons about many tool results. We may keep GPT-4o behind a feature flag for redundancy.

## References
- Architecture doc, §9 "AI Itinerary Agent"
- [Anthropic — Tool Use Best Practices](https://docs.claude.com/en/docs/build-with-claude/tool-use)
