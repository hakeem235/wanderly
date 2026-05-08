"use client";

import { useState } from "react";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
  adults: number;
  cabin: string;
}

interface FlightSearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  loading: boolean;
}

const CABIN_OPTIONS = [
  { value: "economy",  label: "Economy" },
  { value: "premium",  label: "Premium Eco" },
  { value: "business", label: "Business" },
  { value: "first",    label: "First" },
];

export function FlightSearchForm({ onSearch, loading }: FlightSearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState("economy");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ origin: origin.toUpperCase(), destination: destination.toUpperCase(), date, adults, cabin });
  }

  const inputCls =
    "w-full bg-paper border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-colors";

  return (
    <form onSubmit={handleSubmit} className="bg-paper rounded-2xl border border-line p-5 shadow-card">
      <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-4">Flight search</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Origin */}
        <div className="space-y-1">
          <label className="text-xs text-ink-mute">From</label>
          <input
            className={inputCls}
            placeholder="RUH"
            maxLength={3}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
        </div>

        {/* Destination */}
        <div className="space-y-1">
          <label className="text-xs text-ink-mute">To</label>
          <input
            className={inputCls}
            placeholder="HND"
            maxLength={3}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs text-ink-mute">Departure date</label>
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Adults + Cabin */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-ink-mute">Adults</label>
            <input
              type="number"
              min={1}
              max={9}
              className={inputCls}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-ink-mute">Cabin</label>
            <select
              className={inputCls}
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
            >
              {CABIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full sm:w-auto px-8 py-2.5 bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-paper text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? "Searching…" : "Search flights"}
      </button>
    </form>
  );
}
