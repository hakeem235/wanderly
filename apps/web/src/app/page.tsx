import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper font-body antialiased"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 8%, rgba(184,92,56,0.05) 0%, transparent 35%), radial-gradient(circle at 85% 60%, rgba(31,79,74,0.04) 0%, transparent 40%)",
      }}
    >
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="font-display text-2xl text-ink tracking-tight">
            Wander<em className="text-terracotta not-italic italic">ly</em>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-sm text-ink-soft hover:text-terracotta transition-colors">How it works</a>
            <a href="#features" className="text-sm text-ink-soft hover:text-terracotta transition-colors">Features</a>
            <a href="#faq" className="text-sm text-ink-soft hover:text-terracotta transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-warm px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
            <span className="font-mono text-[11px] uppercase tracking-badge text-ink-mute">A travel platform, considered</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[1.08] tracking-tight mb-6">
            Plan trips you&apos;ll <em>actually</em> remember.
          </h1>
          <p className="text-lg text-ink-mute leading-relaxed mb-10 max-w-lg">
            Every flight, hotel, and afternoon plan in one place. AI-assisted itineraries grounded in real, bookable inventory — so the trip you imagine is the trip you book.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta px-7 py-3.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors"
            >
              Start planning free
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-7 py-3.5 text-sm font-medium text-ink hover:bg-paper-warm transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-xs text-ink-mute">Free for up to 3 trips · No credit card required</p>
        </div>

        {/* Boarding-pass hero card */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm">
            {/* Main card */}
            <div className="rounded-2xl border border-line bg-cream shadow-card overflow-hidden">
              <div className="bg-gradient-to-br from-teal to-teal-deep p-6 relative">
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" aria-hidden>
                  <path d="M0,100 Q100,40 200,100 T400,100" fill="none" stroke="white" strokeWidth="1.5"/>
                  <path d="M0,130 Q120,70 240,130 T480,130" fill="none" stroke="white" strokeWidth="1"/>
                  <path d="M0,70 Q80,20 160,70 T320,70 T480,70" fill="none" stroke="white" strokeWidth="0.75"/>
                </svg>
                <div className="relative flex items-center justify-between text-paper">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-badge text-paper/60">Riyadh</div>
                    <div className="font-display text-3xl font-light">RUH</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <svg viewBox="0 0 120 24" className="w-full">
                      <path d="M4 12 Q60 -4 116 12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" strokeDasharray="2 4"/>
                      <circle cx="4" cy="12" r="2.5" fill="#B85C38"/>
                      <circle cx="116" cy="12" r="2.5" fill="#B85C38"/>
                      <text x="60" y="8" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="rgba(255,255,255,0.5)">13H 15M</text>
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-badge text-paper/60">Tokyo</div>
                    <div className="font-display text-3xl font-light">HND</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Tear line */}
                <div className="flex items-center">
                  <div className="h-3 w-3 -ml-1.5 rounded-full bg-paper border border-line" />
                  <div className="flex-1 border-t border-dashed border-line mx-1" />
                  <div className="h-3 w-3 -mr-1.5 rounded-full bg-paper border border-line" />
                </div>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { label: "DEPARTURE", value: "12 Aug · 21:40" },
                  { label: "FLIGHT", value: "SV 802 · Economy" },
                  { label: "STATUS", value: "CONFIRMED" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">{label}</span>
                    <span className={`text-sm font-medium ${label === "STATUS" ? "text-teal" : "text-ink"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating segment card */}
            <div className="absolute -bottom-4 -right-4 rounded-xl border border-line bg-paper shadow-card p-4 w-52">
              <div className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-1">Hotel · 3 nights</div>
              <div className="text-sm font-medium text-ink">Andaz Tokyo</div>
              <div className="text-xs text-ink-mute mt-0.5">Shinjuku · ¥52,000/night</div>
              <div className="mt-2 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                <span className="font-mono text-[10px] text-ink-mute">AI recommended</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="border-t border-line bg-paper-warm">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-badge text-ink-mute mb-3">How it works</div>
              <h2 className="font-display text-4xl text-ink leading-tight max-w-lg">
                From an <em>idea</em> to a confirmed itinerary in three steps.
              </h2>
            </div>
            <div className="font-mono text-xs text-ink-mute">CHAPTER 01 / 03</div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Tell us the trip",
                body: "Destination, dates, vibe, budget. Or paste an existing booking — Wanderly will pull it apart and build the timeline around it.",
                color: "bg-terracotta/10 text-terracotta",
              },
              {
                num: "02",
                title: "The agent searches real inventory",
                body: "Our AI calls the same providers you would — flights from Amadeus, hotels from Booking, activities from Viator. Nothing imagined, nothing stale.",
                color: "bg-teal/10 text-teal",
              },
              {
                num: "03",
                title: "Book it, save it, share it",
                body: "One checkout. One timeline. Forward your hotel email and it lands in the right day. Share the trip and plan together.",
                color: "bg-gold/20 text-gold",
              },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border border-line bg-paper p-8 hover:bg-cream transition-colors">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-mono text-sm font-medium mb-6 ${step.color}`}>
                  {step.num}
                </div>
                <h3 className="font-display text-xl text-ink mb-3">{step.title}</h3>
                <p className="text-sm text-ink-mute leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="border-t border-line bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-badge text-ink-mute mb-3">What you&apos;ll have</div>
              <h2 className="font-display text-4xl text-ink leading-tight max-w-xl">
                Everything for the trip — <em>nothing</em> for the grind.
              </h2>
            </div>
            <div className="font-mono text-xs text-ink-mute">CHAPTER 02 / 03</div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "✈",
                title: "One trip, every booking",
                body: "Flights, hotels, transfers, activities — collapsed into one timeline. Forward confirmation emails or book in-app.",
              },
              {
                icon: "✦",
                title: "AI itinerary, grounded",
                body: "The agent shows its work. Real flights, real hotels, real activities — every recommendation is bookable, nothing hallucinated.",
              },
              {
                icon: "⟳",
                title: "Email import",
                body: "Forward any confirmation email to your trip address. Wanderly parses it and slots the segment in the right day automatically.",
              },
              {
                icon: "👥",
                title: "Plan with your people",
                body: "Share trips with your partner or group. One link, read-only or editable — plan together without losing your mind.",
              },
              {
                icon: "📉",
                title: "Price-drop alerts",
                body: "Save a route, sleep on it, get notified when it drops. No more checking five tabs at 2am.",
              },
              {
                icon: "🌐",
                title: "Built for GCC, ready for the world",
                body: "Arabic and English from day one. Stripe and regional payment methods. Made in Riyadh.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-paper p-7 hover:bg-paper-warm transition-colors group">
                <div className="text-2xl mb-5">{f.icon}</div>
                <h4 className="font-display text-lg text-ink mb-2">{f.title}</h4>
                <p className="text-sm text-ink-mute leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="border-t border-line bg-teal">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="font-display text-7xl text-teal-deep mb-4 leading-none">&ldquo;</div>
          <blockquote className="font-display text-3xl sm:text-4xl text-paper leading-snug italic font-light mb-8">
            Travel platforms forgot the <em className="not-italic text-rust">romance.</em> We&apos;re building one that remembers — without sacrificing the actual usefulness.
          </blockquote>
          <div className="font-mono text-[11px] uppercase tracking-badge text-paper/50">
            — THE TEAM · WANDERLY · RIYADH
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-t border-line bg-paper-deep">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { num: "06", label: "Provider integrations" },
              { num: "$0", label: "Booking fees" },
              { num: "~60s", label: "Time to a planned trip" },
              { num: "EN/AR", label: "From day one" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-4xl text-ink mb-1">
                  <em>{s.num}</em>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-badge text-ink-mute">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-line bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-badge text-ink-mute mb-3">Questions</div>
              <h2 className="font-display text-4xl text-ink">The honest <em>FAQ</em>.</h2>
            </div>
            <div className="font-mono text-xs text-ink-mute">CHAPTER 03 / 03</div>
          </div>

          <div className="space-y-px">
            {[
              {
                q: "When does Wanderly launch?",
                a: "Targeting Q3 2026 for closed beta and Q4 2026 for public launch. Early sign-ups get the first 200 invites and a permanent discount on Pro.",
              },
              {
                q: "How is this different from Booking, Hopper, or just using ChatGPT?",
                a: "Booking is great for hotels alone but doesn't think in trips. Hopper is great for flight prices but doesn't connect to your day. ChatGPT can suggest a trip but can't book it — and half its recommendations are hallucinated. Wanderly does all three: trip-centric organization, multi-provider bookings, and an AI grounded in real, current inventory.",
              },
              {
                q: "What does it cost?",
                a: "Free for up to 3 trips with manual entry. Pro is $9/month or $79/year — unlimited trips, AI planner, price alerts, and group sharing. We earn a small commission from providers when you book through us, so pricing stays fair.",
              },
              {
                q: "Will my data be safe?",
                a: "Passkeys by default — no password to leak. Travel documents are encrypted at rest with per-user keys. Payments go through Stripe (PCI-DSS Level 1) — we never see your card number. Saudi PDPL and GDPR compliant from day one.",
              },
              {
                q: "Where is Wanderly built?",
                a: "In Riyadh. Built for the way GCC travelers actually plan — with Arabic, GCC-friendly payment methods, and an understanding that a good trip is half the joy.",
              },
            ].map((item) => (
              <details key={item.q} className="group border border-line rounded-xl bg-paper mb-2 overflow-hidden">
                <summary className="flex items-center justify-between gap-4 cursor-pointer p-6 list-none hover:bg-paper-warm transition-colors">
                  <span className="font-display text-base text-ink">{item.q}</span>
                  <span className="font-mono text-ink-mute text-sm flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-sm text-ink-mute leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-line bg-paper-warm">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="font-mono text-[11px] uppercase tracking-badge text-ink-mute mb-4">Early access</div>
          <h2 className="font-display text-5xl text-ink mb-4">
            Be there <em>at the start</em>.
          </h2>
          <p className="text-ink-mute mb-10 max-w-md mx-auto">
            First 200 sign-ups get free Pro access for life. After that, beta invites go out monthly.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-8 py-4 text-base font-medium text-paper hover:bg-terracotta-deep transition-colors"
          >
            Reserve my spot →
          </Link>
          <p className="mt-4 text-xs text-ink-mute">No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <a href="/" className="font-display text-xl text-ink block mb-3">
                Wander<em className="text-terracotta italic">ly</em>
              </a>
              <p className="text-sm text-ink-mute leading-relaxed max-w-xs">
                A travel platform built for the way you actually travel — considered, complete, and quietly delightful.
              </p>
            </div>
            {[
              {
                heading: "PRODUCT",
                links: [
                  { label: "How it works", href: "#how" },
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#faq" },
                ],
              },
              {
                heading: "COMPANY",
                links: [
                  { label: "About", href: "#" },
                  { label: "Roadmap", href: "#" },
                  { label: "Contact", href: "mailto:hello@wanderly.co" },
                ],
              },
              {
                heading: "LEGAL",
                links: [
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                  { label: "PDPL", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h5 className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">{col.heading}</h5>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-ink-soft hover:text-terracotta transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-line pt-6">
            <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">© 2026 WANDERLY · MADE IN RIYADH</span>
            <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">BUILT WITH CRAFT · NOT WITH SLOP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
