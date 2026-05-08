"use client";

import { useState } from "react";

export interface FlightOffer {
  id: string;
  provider: string;
  totalCents: number;
  currency: string;
  bestValue: boolean;
  refundable: boolean;
  expiresAt: string;
  slices: {
    origin: string;
    destination: string;
    depart: string;
    arrive: string;
    carrier: string;
    flightNum: string;
    duration: number;
    stops: number;
  }[];
}

interface FlightOfferCardProps {
  offer: FlightOffer;
  trips: { id: string; title: string }[];
  onSaved?: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(mins: number) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function FlightOfferCard({ offer, trips, onSaved }: FlightOfferCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(trips[0]?.id ?? "");

  const price = (offer.totalCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: offer.currency,
    maximumFractionDigits: 0,
  });

  const firstSlice = offer.slices[0];
  const lastSlice = offer.slices[offer.slices.length - 1];
  const totalStops = offer.slices.reduce((acc, s) => acc + s.stops, 0);

  async function handleSave() {
    if (!selectedTrip) return;
    setSaving(true);
    try {
      const res = await fetch("/api/search/save-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: selectedTrip, offer }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`bg-paper rounded-2xl border shadow-card overflow-hidden transition-all ${
      offer.bestValue ? "border-terracotta" : "border-line"
    }`}>
      {/* Best value banner */}
      {offer.bestValue && (
        <div className="bg-terracotta px-4 py-1 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-badge text-paper">Best value</span>
        </div>
      )}

      <div className="p-5">
        {/* Route row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Carrier badge */}
          <div className="w-10 h-10 rounded-lg bg-paper-deep border border-line flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[10px] font-bold text-ink-mute uppercase">
              {firstSlice?.carrier ?? "—"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-ink">{firstSlice?.origin}</span>
              <span className="text-ink-mute">→</span>
              <span className="font-display text-lg text-ink">{lastSlice?.destination}</span>

              <span className={`ml-auto font-mono text-[10px] uppercase tracking-badge px-2 py-0.5 rounded ${
                totalStops === 0
                  ? "bg-teal/10 text-teal"
                  : "bg-paper-deep text-ink-mute"
              }`}>
                {totalStops === 0 ? "Non-stop" : `${totalStops} stop${totalStops > 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-ink-mute">
              {firstSlice && (
                <>
                  <span>{formatTime(firstSlice.depart)}</span>
                  <span className="text-line">—</span>
                  <span>{formatTime(lastSlice?.arrive ?? firstSlice.arrive)}</span>
                  {firstSlice.duration > 0 && (
                    <>
                      <span className="text-line">·</span>
                      <span>{formatDuration(firstSlice.duration)}</span>
                    </>
                  )}
                  <span className="text-line">·</span>
                  <span className="font-mono">{firstSlice.flightNum}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Multi-leg legs (if any additional slices) */}
        {offer.slices.length > 1 && (
          <div className="border-t border-line-soft pt-3 mb-4 space-y-1">
            {offer.slices.slice(1).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-ink-mute">
                <span className="font-mono">{s.flightNum}</span>
                <span>{s.origin} → {s.destination}</span>
                <span className="text-line">·</span>
                <span>{formatTime(s.depart)} – {formatTime(s.arrive)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: price + save */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-display text-display-sm text-ink">{price}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {offer.refundable && (
                <span className="font-mono text-[10px] uppercase tracking-badge text-teal">Refundable</span>
              )}
              <span className="text-[10px] text-ink-mute font-mono">via {offer.provider}</span>
            </div>
          </div>

          {saved ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-badge text-teal">Saved ✓</span>
              <a
                href={`/checkout?tripId=${selectedTrip}&offer=${encodeURIComponent(JSON.stringify(offer))}`}
                className="px-4 py-1.5 bg-terracotta hover:bg-terracotta-deep text-paper text-xs font-medium rounded-lg transition-colors"
              >
                Book now →
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {trips.length > 1 && (
                <select
                  value={selectedTrip}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className="text-xs bg-paper-deep border border-line rounded-lg px-2 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/40"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !selectedTrip}
                className="px-4 py-1.5 bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-paper text-xs font-medium rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save to trip"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
