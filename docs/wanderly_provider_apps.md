# Provider Application Guide — Wanderly

> Apply on day one. Most provider approvals take 1–8 weeks, and **none of them block sandbox access** — you can start integrating immediately while waiting for production credentials. The strategy: get every application in this week, build against sandboxes, flip to production as approvals come in.

## Status tracker

Copy this into a shared spreadsheet or Notion table. Update weekly.

| # | Provider | Category | Apply day | Sandbox access | Prod approval | Status |
|---|---|---|---|---|---|---|
| 1 | **Amadeus Self-Service** | Flights + Hotels | D1 | Immediate | 1–4 weeks | ☐ Applied ☐ Sandbox ☐ Live |
| 2 | **Duffel** | Flights | D1 | Immediate | 1–3 weeks | ☐ Applied ☐ Sandbox ☐ Live |
| 3 | **Booking.com Affiliate** | Hotels | D1 | N/A | 4–8 weeks | ☐ Applied ☐ Live |
| 4 | **Viator (Tripadvisor)** | Activities | D1 | Immediate | 1–2 weeks | ☐ Applied ☐ Sandbox ☐ Live |
| 5 | **GetYourGuide Partner** | Activities | D1 | Immediate | 1–2 weeks | ☐ Applied ☐ Sandbox ☐ Live |
| 6 | **RateHawk / TBO** | Hotels (B2B) | D60 | After contract | 6–10 weeks | ☐ Applied (V2) |
| 7 | **Mapbox** | Maps | D1 | Immediate | Self-serve | ☐ Applied ☐ Live |
| 8 | **Stripe** | Payments | D1 | Immediate | Self-serve | ☐ Applied ☐ Live |
| 9 | **Resend** | Email | D1 | Immediate | Self-serve | ☐ Applied ☐ Live |

---

## How to use this guide

For each provider, this document gives you:

1. **Quick summary** — what they do, why we need them
2. **Application URL** — go straight to the form
3. **Approval timeline** — realistic expectation, not what their site says
4. **Documents you'll need** — gather these in advance
5. **Qualifying questions and suggested answers** — copy-paste, customize for your situation
6. **Saudi-specific notes** — flags for KYC, licensing, and tax
7. **Red flags to avoid** — things that get applications rejected or delayed

The suggested answers are written for an early-stage Wanderly. Adjust them as your business changes — but keep them **honest**. Lying on these applications is grounds for permanent ban from the network, which is hard to recover from.

---

# 1. Amadeus Self-Service

> The single most important integration for MVP. Flights + hotels under one contract.

## Summary

- **What:** GDS access via REST APIs. Flights (Amadeus Travel APIs), hotels (Hotel Search API), plus enrichment APIs (airport autocomplete, flight delay prediction).
- **Why primary:** Best developer experience in the segment, single contract for two of our three booking categories, sandbox is immediate, production review is fast for our scale.

## Application

- **URL:** https://developers.amadeus.com/register
- **Free tier:** 2,000 calls/month per API in sandbox — enough for development and testing.
- **Production access:** requires approval after sandbox proof-of-work.

## Approval timeline

- **Sandbox:** instant after email verification.
- **Production:** typically 1–4 weeks. Be prepared for back-and-forth — they ask for screenshots of your app calling sandbox successfully before approving prod keys.

## Documents needed

- Company registration certificate (Saudi commercial registration / CR)
- VAT number (or letter explaining you're not yet VAT-registered)
- Website URL (the landing page is fine — doesn't need to be the full app)
- Privacy policy URL (Saudi PDPL compliant)
- Brief technical description (stack, where data is hosted)

## Form questions and suggested answers

> Note: Amadeus's actual form fields change occasionally. The categories below are durable; map them to whatever they're calling fields this month.

**Q: Company name**
> Wanderly Technologies *(or your registered legal entity)*

**Q: Use case / what are you building?**
> Wanderly is a SaaS travel platform for individual travelers in the GCC and globally. We are integrating Amadeus Self-Service to enable flight and hotel search and booking within our consumer application. Users plan a trip in our timeline interface, search for flights and hotels via the Amadeus APIs, and book through our checkout flow. We use Amadeus as our primary inventory source and supplement with Duffel for flight redundancy.

**Q: Expected monthly API call volume**
> Year 1: ~50,000 search calls/month, ~500 bookings/month
> Year 2: ~500,000 search calls/month, ~5,000 bookings/month
>
> *(Be honest and conservative. Inflated estimates trigger more scrutiny without benefit.)*

**Q: Which APIs do you plan to use?**
> - Flight Offers Search (primary)
> - Flight Offers Price (verification before booking)
> - Flight Create Orders (booking)
> - Hotel Search
> - Hotel Booking
> - Airport & City Search (autocomplete)
> - Travel Recommendations (destination ideas, V2)

**Q: Where will user payment data be processed?**
> All payment processing is handled by Stripe (PCI-DSS Level 1). Wanderly's servers do not store card data. Amadeus receives a Stripe-issued payment token at booking confirmation time, never the raw card details.

**Q: Where is your application hosted?**
> Application servers in Frankfurt and Bahrain (Fly.io regions). Database in Frankfurt (Neon). Customer data of Saudi residents is replicated to a regional KSA replica per Saudi PDPL requirements *(true once you set this up — be honest if not yet implemented)*.

**Q: Are you operating as a registered travel agency?**
> *(This is the critical question. Two valid answers depending on your structure:)*
>
> **Option A — operating under a licensed partner umbrella:**
> > We operate as a technology platform under the umbrella of [Partner Travel Agency Name], a licensed travel agency in Saudi Arabia (License #XXX-XXX). Bookings are processed through their IATA-accredited entity.
>
> **Option B — own license:**
> > Wanderly Technologies holds Saudi Tourism License #XXX (Class B), issued [date] by the Ministry of Tourism. We are pursuing IATA accreditation, currently expected by Q4 2026.
>
> **Option C — pre-license, B2C only:**
> > We are currently pre-license, planning to launch under a partnership with a licensed agency for the first 6 months while we obtain our own Class B agency license. We are happy to discuss compliance arrangements.

## Saudi-specific notes

- **VAT:** Saudi Arabia's 15% VAT applies to your service margin (not the underlying ticket price for flights — IATA rules). Track this separately.
- **Travel agent licensing:** Required by Saudi Ministry of Tourism for travel agency operations. Class A (full IATA) takes 6+ months; Class B (limited services) takes 3–4 months. Apply in parallel with Amadeus.
- **In-Kingdom data:** Saudi PDPL (effective 2024) requires personal data of Saudi residents to be stored in-Kingdom or have explicit cross-border consent. Either spin up a regional Postgres replica in AWS me-south-1 / STC Cloud, or capture explicit consent at signup.

## Red flags

- **Don't** claim you're a "metasearch" or "comparison" platform — Amadeus has different (and worse) terms for those.
- **Don't** inflate volume estimates. They cross-check against your actual sandbox usage during review.
- **Don't** apply with a personal Gmail address. Use a domain email (`founder@wanderly.co`).
- **Do** include screenshots in your application showing your app's mockups (the design system you have will impress).

---

# 2. Duffel

> Modern flight API. Backup for Amadeus. Better NDC fare access for some carriers.

## Summary

- **What:** Modern flight booking API. Strong on direct airline NDC content. Generally better DX than legacy GDSs.
- **Why secondary:** Redundancy + better fares from carriers that price NDC differently. Saudia, Emirates, and Qatar Airways have NDC fares that don't always show up in GDS-only providers.

## Application

- **URL:** https://duffel.com/get-started
- **Sandbox:** free, instant.
- **Production:** requires KYC + commercial agreement.

## Approval timeline

- **Sandbox:** instant.
- **Production:** 1–3 weeks. They have a sales-led review for new accounts.

## Documents needed

- Company registration certificate
- Beneficial ownership documents (UBO)
- Bank account for receiving commissions / settlements
- VAT registration (or non-registration letter)
- Compliance attestation (anti-money laundering)

## Form questions and suggested answers

**Q: Tell us about your business**
> Wanderly is a consumer travel platform launching in the GCC in Q3 2026. We integrate multiple flight providers to give users the best inventory and pricing. Duffel will be our secondary flight provider, with Amadeus as primary. We expect ~40% of flight searches to be served by Duffel, primarily for routes where NDC fares offer materially better pricing than GDS content.

**Q: Volume expectations**
> Year 1: ~20,000 flight searches/month, ~200 bookings/month
> Year 2: ~200,000 flight searches/month, ~2,000 bookings/month

**Q: Which carriers are most important to you?**
> Saudia (SV), Emirates (EK), Qatar Airways (QR), Etihad (EY), flydubai (FZ), Air Arabia (G9). GCC-to-Asia routes are our highest-volume corridor.

**Q: Will you use Duffel Payments or your own merchant account?**
> Wanderly will use its own Stripe Connect merchant account. We do not use Duffel Payments. We pass payment tokens at booking time via the Confirm API.

**Q: How will you handle support and disruptions?**
> First-line support: in-app help center + email (response within 4 hours during business hours, 24/7 for active travel disruptions). Disruption escalation: through Duffel's order management API + direct carrier contact for high-severity cases. We will publish our SLA in our terms of service.

## Saudi-specific notes

- Duffel's API is hosted out of EU (London). Cross-border transfer of Saudi resident data requires explicit consent in your privacy policy.
- Duffel settles commissions in USD/EUR/GBP. Plan for FX in your accounting.

## Red flags

- **Don't** apply if you don't have a real domain email and a deployable landing page. They check.
- **Don't** mention you're using them as a "fallback" or "backup" — frame it as inventory diversification with specific use cases.

---

# 3. Booking.com Affiliate Partner Program

> Largest hotel inventory in the world. Trusted brand. Slowest approval.

## Summary

- **What:** Affiliate API access to Booking.com's full hotel inventory.
- **Why:** Brand recognition matters for hotels. Users feel safer seeing "Booking.com" alongside an unknown provider. Inventory breadth (~28M listings) is unmatched.
- **Why slow:** Booking is selective. They prefer partners with existing traffic.

## Application

- **URL:** https://www.booking.com/affiliate-program/v2/index.html
- Then specifically the **API access** track: requires separate review beyond the deep-link affiliate basic tier.

## Approval timeline

- **Deep-link affiliate (basic):** 1–2 weeks. Gives you tracked links — no API.
- **API access (Distribution XML):** 4–8 weeks. Required for real inventory integration.

## Documents needed

- Company registration
- Active website with real traffic (this is the hard part for pre-launch)
- Tax forms (W-8BEN-E for non-US, or equivalent)
- VAT number

## Form questions and suggested answers

**Q: Describe your website / app**
> Wanderly (wanderly.co) is a SaaS travel planning and booking platform. Users plan multi-city trips in a timeline interface, with AI-assisted itinerary generation. Hotels appear as bookable segments within trips. Our integration would surface Booking.com inventory in hotel search results alongside other providers, with deep-links and (when API access is granted) inline booking.

**Q: Current monthly traffic**
> *(Honest answer:)* Pre-launch. Closed beta launching Q3 2026. Wait-list of [N] signups currently. Public launch projected for Q4 2026 with ~10,000 MAU in month 1.
>
> *(If they require existing traffic, mention:)* If your program requires existing traffic for API access, we are happy to start with the deep-link affiliate tier and apply for API access once we hit your traffic threshold.

**Q: What value do you bring to Booking?**
> 1. **New customer demographic.** GCC market has high travel spend per capita and is underserved by current Booking marketing. Our launch strategy targets this region.
> 2. **AI-driven discovery.** Our itinerary planner surfaces hotels users wouldn't otherwise search for — incremental bookings, not just substitution.
> 3. **Trip-context bookings.** Our users book hotels as part of multi-segment trips. Average booking value is higher than typical search-and-book, because they're committed to a trip.

**Q: How will you display Booking.com inventory?**
> Hotel results will be displayed in our search and itinerary interfaces with clear "via Booking.com" attribution per your brand guidelines. Our API integration will respect rate parity, conversion attribution, and customer service responsibilities per the Distribution Partner Agreement.

## Saudi-specific notes

- Saudi VAT applies to your commission income. Booking pays you net of any taxes they're required to withhold.
- Booking.com is fully accessible in KSA — no geo-restriction issues.

## Red flags

- **Don't** apply for API access on day one. They'll reject. Apply for the affiliate tier first, get accepted, build the relationship, then apply for API access at month 3 with traffic data.
- **Don't** undercut their prices in your display. Rate parity violations are grounds for termination.
- **Do** mention your existing traffic plans (paid social, content, partnerships) — this signals you'll deliver volume.

---

# 4. Viator Partner Program (Tripadvisor)

> Largest activity inventory globally. Easy approval. Mature affiliate program.

## Summary

- **What:** API access to Viator's catalog of ~395k tours, activities, and experiences.
- **Why:** Activities round out the trip. Viator is the easiest first integration — they want partners.

## Application

- **URL:** https://www.viator.com/partner/

## Approval timeline

- **Affiliate (deep-link):** 1–3 days. Almost automatic.
- **API access:** 1–2 weeks after demonstrating product fit.

## Documents needed

- Company info
- Website
- Stripe / PayPal for receiving commissions

## Form questions and suggested answers

**Q: How do you plan to integrate Viator?**
> We integrate Viator's Affiliate API to surface activities within our trip itinerary builder. When a user is planning a day in a destination, our AI agent and search tools query Viator alongside other activity providers, surfacing relevant experiences. Bookings are completed through Viator's checkout via deep-link initially, with full inline booking after API approval.

**Q: Your audience demographic**
> Travelers aged 25–55 in the GCC and globally, planning multi-day leisure trips. Average trip length 5–14 days, average trip spend $2,000–$8,000. Heavy interest in cultural experiences, food tours, and unique local activities.

## Saudi-specific notes

- Viator's content is global. Watch for activity recommendations that conflict with local norms when displaying to Saudi-based users (alcohol-centric tours, etc). Filter at the application layer.

## Red flags

- **Don't** mention Viator as your only activity provider — they prefer partners who diversify. Mention GetYourGuide and Airbnb Experiences in your plans.

---

# 5. GetYourGuide Partner

> Curated activity inventory. Better UX for some destinations. Apply alongside Viator.

## Summary

- **What:** Activity & experience booking API. More curated than Viator (smaller catalog, higher quality bar).
- **Why:** Inventory diversity + better experience for users in some categories (food tours, cooking classes especially).

## Application

- **URL:** https://www.getyourguide.com/partners/

## Approval timeline

- 1–2 weeks for partner program approval. API access opens after that.

## Documents needed

- Same as Viator. They're not strict.

## Form questions and suggested answers

**Q: How will you use GetYourGuide?**
> Wanderly's AI-powered itinerary planner surfaces activities and experiences for each day of a user's trip. GetYourGuide will be our secondary activity provider, complementing Viator. We choose between them based on availability, price, and review quality per activity. Strong preference for GetYourGuide where they offer unique, curated experiences not available elsewhere.

**Q: Why partner with GetYourGuide specifically?**
> Curation quality, particularly for European and East Asian destinations, where GYG's selection is often stronger than Viator. Better mobile experience matters for our PWA-first product. Strong inventory for the Tokyo, Lisbon, and Barcelona corridors where our early users are concentrated.

## Saudi-specific notes

- Same content filtering considerations as Viator.

## Red flags

- None specific. They're partner-friendly.

---

# 6. RateHawk / TBO (defer to Phase 7+ / V2)

> B2B hotel net rates. Better economics than Booking.com Affiliate, but heavier onboarding.

## Summary

- **What:** B2B hotel inventory at net rates (you set your own markup, vs. commission split).
- **Why:** Significantly better unit economics at scale. Net rate gives 8–15% margin vs. Booking's 4% commission.
- **Why defer:** Onboarding takes 6–10 weeks, requires ~$5–10k deposit, and is overkill for MVP volume.

## Apply when:

- You have 6+ months of booking history
- You're processing $50k+/month in hotel volume
- You can put up the security deposit
- You have a dedicated person to handle KYC paperwork

**Application URL when ready:** https://www.ratehawk.com/partners

---

# 7. Mapbox

> Maps + geocoding. Self-serve. Apply day 1.

## Summary

- **What:** Map tiles, geocoding API, navigation. Better customization than Google Maps, predictable pricing.
- **Why:** Visual maps are a core part of our trip detail UI. Mapbox's design flexibility lets us match our brand (custom map styles in the editorial palette).

## Application

- **URL:** https://account.mapbox.com/auth/signup/
- **Free tier:** 50,000 monthly active map loads, 100,000 geocoding requests. Comfortably covers MVP.

## Setup

1. Create account, verify email.
2. Create an access token. Restrict to your domain in production.
3. Create a custom map style in Mapbox Studio matching the design system (cream paper, ink roads, terracotta accents).
4. Set up billing alerts at $25, $50, $100 thresholds.

## Saudi-specific notes

- Mapbox map tiles render correctly in Arabic. Ensure your style includes the Arabic label layer.
- Saudi geographic features (Empty Quarter, Mecca, Medina) render correctly. No special handling needed.

---

# 8. Stripe

> Payments. Foundational. Apply day 1.

## Summary

- **What:** Subscription billing (Pro plan), payment intents (booking checkout), Connect (commission flows).
- **Why:** Industry standard. Mature for travel use case. Handles Saudi cards, STC Pay, mada (Saudi domestic network) via Stripe Saudi Arabia.

## Application

- **URL:** https://dashboard.stripe.com/register

## Documents needed (Saudi onboarding)

- Saudi commercial registration (CR)
- VAT certificate (or non-registration letter)
- IBAN for settlement
- Beneficial ownership info
- Business address verification (utility bill or bank statement)

## Approval timeline

- Test mode: instant.
- Live mode: 2–7 days for Saudi accounts. Connect onboarding: same.

## Critical setup steps

1. Enable Saudi Arabia as an operating country.
2. Apply for Stripe Connect (Standard or Express) — required for taking commission cuts on bookings.
3. Enable mada (Saudi network) and STC Pay payment methods.
4. Set up webhooks for: `checkout.session.completed`, `customer.subscription.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`.
5. Configure radar rules — travel is a higher-fraud category, tighten defaults.

## Saudi-specific notes

- mada cards (the Saudi domestic debit network) require explicit enablement.
- STC Pay is essentially required for KSA market — many users prefer it over cards.
- Apple Pay works on Saudi cards; enable it.
- Stripe Tax handles Saudi 15% VAT calculation if you enable it for the right scope.

## Red flags

- **Don't** start collecting payments in live mode before your terms of service and refund policy are published. Stripe will hold funds.
- **Don't** mix test and live keys in the same environment file. Ever.

---

# 9. Resend

> Transactional email. Self-serve. Apply day 1.

## Summary

- **What:** Modern transactional email API, React Email templates, inbound email parsing.
- **Why:** Best DX for transactional email. Inbound webhook is exactly what we need for the email-import feature (forward confirmations to a Wanderly address).

## Application

- **URL:** https://resend.com/signup
- **Free tier:** 3,000 emails/month, 100/day.
- **Pro:** $20/month for 50,000 emails.

## Setup

1. Sign up, verify your domain (`wanderly.co`).
2. Add SPF, DKIM, DMARC records to your DNS.
3. Create an API key.
4. Set up the inbound parser at `forward+TRIP_ID@import.wanderly.co`. Configure the webhook to your `apps/web/api/imports/email` endpoint.
5. Configure bounce/complaint handling — auto-suspend users who hard-bounce.

## Saudi-specific notes

- DKIM/SPF setup: ensure your DNS provider in KSA (or wherever you host DNS) propagates these records correctly. Some local DNS providers are slow or strip TXT records.

---

# Compliance: travel agent licensing in KSA

> Tackle this in parallel with provider applications. Don't let it block development, but don't ignore it.

## The situation

The Saudi Ministry of Tourism requires a license for entities that "facilitate travel" — booking flights, hotels, packages on behalf of customers. Three options:

### Option A: Operate under a licensed partner umbrella (recommended for MVP)

- Find a Saudi licensed travel agency willing to act as your "host" — bookings flow through their IATA accreditation.
- They take a small cut (typically 1–2% of GMV) for providing the legal cover.
- You operate as a "technology partner" or "white-label client" of theirs.
- **Pros:** can launch immediately, no licensing delay, no $50k+ bond capital tied up.
- **Cons:** ongoing partner cost, legal complexity if the partnership ends, less brand control.

### Option B: Get your own Class B license

- Class B = limited services agency. Can sell tickets, package tours, accommodation. Can't issue IATA tickets directly (you'll do this via Amadeus, which is fine).
- Process: ~3–4 months. Requires SAR 100,000 (~$26k) capital, office space, named manager with travel industry experience.
- **Pros:** independent operation, lower ongoing cost.
- **Cons:** capital tied up, time delay, need to recruit a licensed manager.

### Option C: Get Class A (IATA-accredited) license

- Required if you want to issue IATA tickets directly. Bigger scope.
- Process: 6+ months. Higher capital requirement (~SAR 500k = $130k), bond, full office, full IATA accreditation process.
- **Don't do this for MVP.** Wait until you're processing 1000+ bookings/month and the unit economics justify the IATA fee structure.

## Recommended path

1. **Months 1–6:** Operate under partner umbrella (Option A). Validate product-market fit.
2. **Months 6–12:** If volume justifies, start Class B application (Option B). Run in parallel with partner umbrella.
3. **Year 2+:** Consider Class A if IATA direct gives material economics.

---

# What to do this week

In priority order — most actions take 30 minutes each:

1. **Register the legal entity** (or confirm yours covers SaaS + travel)
2. **Reserve `wanderly.co`** (or whatever brand you land on) — domain + Cloudflare DNS
3. **Apply to Amadeus, Duffel, Viator, GetYourGuide, Booking.com Affiliate** — same day, all 5
4. **Sign up for Stripe (Saudi onboarding), Resend, Mapbox** — these are self-serve
5. **Reach out to 3–5 licensed Saudi travel agencies** about umbrella partnerships — get a feel for the going rate (1–2% is typical)
6. **Have a lawyer (Saudi-licensed) review** your terms of service, privacy policy, and the partner umbrella agreement template
7. **Set up the wait-list page** (use the landing page template) and start collecting signups — these become evidence for Booking.com Affiliate and Amadeus production reviews

By the end of week 2, you should have:

- ✅ Sandbox access to Amadeus, Duffel, Viator, GYG (all of them, in parallel)
- ✅ Stripe in test mode, ready for Connect onboarding
- ✅ Resend with verified domain and inbound parser configured
- ✅ Mapbox key and a custom map style draft
- ✅ At least one travel agency umbrella partnership in negotiation
- ✅ A wait-list landing page collecting real signups

You can then start Phase 4 (flight + hotel search) of the build with sandbox keys, and the production approvals will trickle in over the following weeks just in time for soft launch.

---

# Tracking spreadsheet template

Copy this into Google Sheets / Notion. Update weekly during the application phase.

| Provider | Applied | Sandbox | Production | Contact name | Contact email | Contract signed | Notes |
|---|---|---|---|---|---|---|---|
| Amadeus | YYYY-MM-DD | YYYY-MM-DD | | | | | |
| Duffel | | | | | | | |
| Booking Affiliate | | | | | | | |
| Booking API | | | | | | | |
| Viator | | | | | | | |
| GetYourGuide | | | | | | | |
| Mapbox | | | | | | | |
| Stripe | | | | | | | |
| Resend | | | | | | | |

---

*Wanderly — Provider Application Guide · v1.0 · For Ahmed · 2026*
