"use client";

export interface FilterState {
  maxPrice: number;
  refundableOnly: boolean;
  stops: "any" | "nonstop" | "one";
}

interface FlightFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  maxAvailablePrice: number;
}

export function FlightFilters({ filters, onChange, maxAvailablePrice }: FlightFiltersProps) {
  return (
    <aside className="bg-paper rounded-2xl border border-line p-5 shadow-card space-y-6 sticky top-4">
      <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">Filters</p>

      {/* Stops */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink">Stops</p>
        {(["any", "nonstop", "one"] as const).map((val) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stops"
              value={val}
              checked={filters.stops === val}
              onChange={() => onChange({ ...filters, stops: val })}
              className="accent-terracotta"
            />
            <span className="text-sm text-ink">
              {val === "any" ? "Any" : val === "nonstop" ? "Non-stop" : "1 stop"}
            </span>
          </label>
        ))}
      </div>

      {/* Max price */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink">Max price</p>
          <p className="text-xs text-terracotta font-mono">
            ${Math.round(filters.maxPrice / 100).toLocaleString()}
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={maxAvailablePrice}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-terracotta"
        />
        <div className="flex justify-between text-[10px] text-ink-mute font-mono">
          <span>$0</span>
          <span>${Math.round(maxAvailablePrice / 100).toLocaleString()}</span>
        </div>
      </div>

      {/* Refundable */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.refundableOnly}
          onChange={(e) => onChange({ ...filters, refundableOnly: e.target.checked })}
          className="accent-terracotta rounded"
        />
        <span className="text-sm text-ink">Refundable only</span>
      </label>
    </aside>
  );
}
