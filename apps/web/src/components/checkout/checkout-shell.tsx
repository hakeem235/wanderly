"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { FlightOffer } from "@wanderly/sdk";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface Traveler {
  firstName: string;
  lastName:  string;
  dob:       string;
  passport:  string;
}

interface CheckoutShellProps {
  tripId:     string;
  tripTitle:  string;
  offerJson:  string;
}

export function CheckoutShell({ tripId, tripTitle, offerJson }: CheckoutShellProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId,    setBookingId]    = useState<string | null>(null);
  const [offer]        = useState<FlightOffer | null>(() => {
    try { return JSON.parse(decodeURIComponent(offerJson)) as FlightOffer; } catch { return null; }
  });

  const [travelers, setTravelers] = useState<Traveler[]>([
    { firstName: "", lastName: "", dob: "", passport: "" },
  ]);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [step, setStep]       = useState<"travelers" | "payment" | "done">("travelers");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const price = offer
    ? (offer.totalCents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: offer.currency,
        maximumFractionDigits: 0,
      })
    : "—";

  const firstSlice = offer?.slices[0];
  const lastSlice  = offer?.slices[offer.slices.length - 1];

  function updateTraveler(i: number, field: keyof Traveler, val: string) {
    setTravelers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));
  }

  async function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) return;
    setLoading(true);
    setError(null);

    const idempotencyKey = `${tripId}-${offer.id}-${Date.now()}`;

    try {
      const res = await fetch("/api/booking/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          offerId:        offer.id,
          provider:       offer.provider,
          totalCents:     offer.totalCents,
          currency:       offer.currency,
          idempotencyKey,
          offer,
        }),
      });

      const json = await res.json() as { bookingId?: string; clientSecret?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to create booking");

      setBookingId(json.bookingId ?? null);
      setClientSecret(json.clientSecret ?? null);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-paper border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-colors";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-display-md text-ink leading-tight">
          Complete your <em>booking</em>.
        </h1>
        <p className="mt-1 text-sm text-ink-mute">Trip: {tripTitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          {step === "travelers" && (
            <form onSubmit={handleContinueToPayment} className="space-y-4">
              {/* Travelers */}
              <div className="bg-paper rounded-2xl border border-line p-5 shadow-card">
                <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">
                  Traveler details
                </p>
                {travelers.map((t, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs text-ink-mute">First name</label>
                      <input className={inputCls} value={t.firstName} required
                        onChange={(e) => updateTraveler(i, "firstName", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-ink-mute">Last name</label>
                      <input className={inputCls} value={t.lastName} required
                        onChange={(e) => updateTraveler(i, "lastName", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-ink-mute">Date of birth</label>
                      <input type="date" className={inputCls} value={t.dob} required
                        onChange={(e) => updateTraveler(i, "dob", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-ink-mute">Passport number</label>
                      <input className={inputCls} placeholder="A12345678" value={t.passport} required
                        onChange={(e) => updateTraveler(i, "passport", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="bg-paper rounded-2xl border border-line p-5 shadow-card">
                <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">
                  Contact information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-ink-mute">Email</label>
                    <input type="email" className={inputCls} value={contact.email} required
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-ink-mute">Phone (with country code)</label>
                    <input type="tel" className={inputCls} placeholder="+966 50 000 0000" value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-paper font-medium rounded-xl transition-colors"
              >
                {loading ? "Creating booking…" : "Continue to payment →"}
              </button>
            </form>
          )}

          {step === "payment" && clientSecret && (
            <div className="bg-paper rounded-2xl border border-line p-5 shadow-card">
              <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">
                Payment
              </p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#B85C38",
                      colorBackground: "#FAF6EC",
                      colorText: "#15191F",
                      colorDanger: "#B85C38",
                      borderRadius: "8px",
                      fontFamily: "DM Sans, system-ui, sans-serif",
                    },
                  },
                }}
              >
                <PaymentForm price={price} bookingId={bookingId ?? ""} onDone={() => setStep("done")} />
              </Elements>
            </div>
          )}

          {step === "done" && (
            <div className="bg-paper rounded-2xl border border-line p-10 shadow-card text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-display-sm text-ink mb-2">Booking confirmed!</h2>
              <p className="text-sm text-ink-mute mb-6">
                Your booking is confirmed. Check your email for the e-ticket.
              </p>
              <a href={`/trips/${tripId}`}
                className="inline-block px-6 py-2.5 bg-terracotta hover:bg-terracotta-deep text-paper text-sm font-medium rounded-xl transition-colors">
                View trip →
              </a>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <aside className="space-y-4">
          <div className="bg-paper rounded-2xl border border-line p-5 shadow-card sticky top-4">
            <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">
              Order summary
            </p>

            {offer && firstSlice ? (
              <div className="space-y-3">
                <div>
                  <p className="font-display text-lg text-ink">
                    {firstSlice.origin} → {lastSlice?.destination ?? firstSlice.destination}
                  </p>
                  <p className="text-xs text-ink-mute mt-0.5">
                    {new Date(firstSlice.depart).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </p>
                </div>

                <div className="border-t border-line-soft pt-3 space-y-1">
                  {offer.slices.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs text-ink-mute">
                      <span className="font-mono">{s.flightNum}</span>
                      <span>{s.origin} → {s.destination}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line-soft pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-mute">Total</span>
                    <span className="font-display text-display-sm text-ink">{price}</span>
                  </div>
                  <p className="text-[10px] text-ink-mute font-mono mt-1 uppercase tracking-badge">
                    via {offer.provider}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-mute">No offer loaded.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Stripe payment form (must be inside <Elements>) ───────────────────────────

function PaymentForm({
  price,
  bookingId,
  onDone,
}: {
  price: string;
  bookingId: string;
  onDone: () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirm?bookingId=${bookingId}`,
      },
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message ?? "Payment failed");
      setLoading(false);
    } else {
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-paper font-medium rounded-xl transition-colors"
      >
        {loading ? "Processing…" : `Pay ${price}`}
      </button>

      <p className="text-center text-[10px] text-ink-mute">
        Secured by Stripe · Your card details are never stored on our servers
      </p>
    </form>
  );
}
