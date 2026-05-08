import type { components, operations } from "./search.generated";

// Re-export the generated schema types for consumers
export type FlightOffer = components["schemas"]["FlightOffer"];
export type FlightSlice = components["schemas"]["FlightSlice"];
export type FlightSearchResponse = components["schemas"]["FlightSearchResponse"];
export type ProblemDetails = components["schemas"]["ProblemDetails"];
export type SearchFlightsParams = operations["searchFlights"]["parameters"]["query"];

// ── Error type ────────────────────────────────────────────────────────────────

export class SearchError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string
  ) {
    super(`[${status}] ${title}${detail ? `: ${detail}` : ""}`);
    this.name = "SearchError";
  }
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface SearchClientOptions {
  /** Base URL of the search service. Defaults to http://localhost:8080 */
  baseUrl?: string;
  /** Optional fetch implementation (useful for testing) */
  fetch?: typeof globalThis.fetch;
}

export class SearchClient {
  private readonly baseUrl: string;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(opts: SearchClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? "http://localhost:8080").replace(/\/$/, "");
    this._fetch = opts.fetch ?? globalThis.fetch;
  }

  /** GET /health */
  async health(): Promise<{ ok: boolean; service: string }> {
    const res = await this._fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new SearchError(res.status, "Health check failed");
    return res.json() as Promise<{ ok: boolean; service: string }>;
  }

  /** GET /v1/flights */
  async searchFlights(params: SearchFlightsParams): Promise<FlightSearchResponse> {
    const qs = new URLSearchParams();
    qs.set("origin", params.origin);
    qs.set("destination", params.destination);
    qs.set("date", params.date);
    if (params.adults !== undefined) qs.set("adults", String(params.adults));
    if (params.cabin) qs.set("cabin", params.cabin);
    if (params.returnDate) qs.set("returnDate", params.returnDate);

    const res = await this._fetch(`${this.baseUrl}/v1/flights?${qs}`);

    if (!res.ok) {
      const body = await res.json() as ProblemDetails;
      throw new SearchError(res.status, body.title, body.detail);
    }

    return res.json() as Promise<FlightSearchResponse>;
  }
}

/** Singleton for server-side use — reads SEARCH_SERVICE_URL from env */
export function createServerSearchClient(): SearchClient {
  return new SearchClient({
    baseUrl: process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:8080",
  });
}
