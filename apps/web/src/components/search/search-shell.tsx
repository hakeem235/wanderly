"use client";

import { useState, useMemo } from "react";
import { FlightSearchForm, type FlightSearchParams } from "./flight-search-form";
import { FlightFilters, type FilterState } from "./flight-filters";
import { FlightOfferCard, type FlightOffer } from "./flight-offer-card";

interface SearchShellProps {
  trips: { id: string; title: string }[];
}

const DEFAULT_FILTERS: FilterState = {
  maxPrice: 999_999_99,
  refundableOnly: false,
  stops: "any",
};

export function SearchShell({ trips }: SearchShellProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searched, setSearched] = useState(false);

  const maxPrice = useMemo(
    () => (offers.length > 0 ? Math.max(...offers.map((o) => o.totalCents)) : 999_999_99),
    [offers]
  );

  async function handleSearch(params: FlightSearchParams) {
    setLoading(true);
    setError(null);
    setSearched(true);

    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      adults: String(params.adults),
      cabin: params.cabin,
    });

    try {
      const res = await fetch(`/api/search/flights?${qs}`);
      const json = await res.json() as { data?: FlightOffer[]; detail?: string };
      if (!res.ok) throw new Error(json.detail ?? "Search failed");
      const results = json.data ?? [];
      setOffers(results);
      setFilters({ ...DEFAULT_FILTERS, maxPrice: Math.max(...results.map((o) => o.totalCents), 999_999_99) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (o.totalCents > filters.maxPrice) return false;
      if (filters.refundableOnly && !o.refundable) return false;
      if (filters.stops !== "any") {
        const totalStops = o.slices.reduce((a, s) => a + s.stops, 0);
        if (filters.stops === "nonstop" && totalStops !== 0) return false;
        if (filters.stops === "one" && totalStops !== 1) return false;
      }
      return true;
    });
  }, [offers, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md text-ink leading-tight">
          Find your <em>flight</em>.
        </h1>
        <p className="mt-1 text-sm text-ink-mute">Search across providers, save the best quote to your trip.</p>
      </div>

      <FlightSearchForm onSearch={handleSearch} loading={loading} />

      {(searched || offers.length > 0) && (
        <div className="flex gap-6 items-start">
          {offers.length > 0 && (
            <div className="hidden lg:block w-52 flex-shrink-0">
              <FlightFilters
                filters={filters}
                onChange={setFilters}
                maxAvailablePrice={maxPrice}
              />
            </div>
          )}

          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">
                {loading
                  ? "Searching providers…"
                  : error
                  ? "Error"
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              </p>
              {offers.length > 0 && filtered.length !== offers.length && (
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, maxPrice })}
                  className="text-xs text-terracotta hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-paper rounded-2xl border border-line p-5 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-paper-deep" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-paper-deep rounded w-1/3" />
                        <div className="h-3 bg-paper-deep rounded w-1/2" />
                      </div>
                      <div className="h-6 bg-paper-deep rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.map((offer) => (
              <FlightOfferCard
                key={offer.id}
                offer={offer}
                trips={trips}
              />
            ))}

            {!loading && !error && searched && filtered.length === 0 && offers.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-line bg-paper p-14 text-center">
                <p className="font-display text-display-xs text-ink mb-2">No flights found</p>
                <p className="text-sm text-ink-mute">
                  The search service may not have Amadeus credentials configured yet, or no results matched.
                </p>
              </div>
            )}

            {!loading && !error && searched && filtered.length === 0 && offers.length > 0 && (
              <div className="rounded-2xl border-2 border-dashed border-line bg-paper p-10 text-center">
                <p className="text-sm text-ink-mute">No results match your filters.</p>
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, maxPrice })}
                  className="mt-3 text-xs text-terracotta hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
