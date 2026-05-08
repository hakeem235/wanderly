package aggregator

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/wanderly/search/internal/cache"
	"github.com/wanderly/search/internal/providers"
	"go.uber.org/zap"
)

const cacheTTL = 10 * time.Minute

// Aggregator fans out to multiple providers concurrently, caches results,
// deduplicates by flight number, and returns ranked offers.
type Aggregator struct {
	providers []providers.Provider
	cache     *cache.Client
	log       *zap.Logger
}

// New creates an Aggregator with the given providers and cache.
func New(ps []providers.Provider, c *cache.Client, log *zap.Logger) *Aggregator {
	return &Aggregator{providers: ps, cache: c, log: log}
}

// SearchFlights returns ranked, deduplicated offers across all providers.
func (a *Aggregator) SearchFlights(ctx context.Context, q providers.FlightQuery) ([]providers.Offer, error) {
	cacheKey := cache.FlightKey(
		q.Origin, q.Destination,
		q.Depart.Format("2006-01-02"),
		q.Cabin, q.PaxAdult,
	)

	// Cache hit
	var cached []providers.Offer
	if hit, err := a.cache.Get(ctx, cacheKey, &cached); err != nil {
		a.log.Warn("cache get failed", zap.Error(err))
	} else if hit {
		a.log.Debug("cache hit", zap.String("key", cacheKey))
		return cached, nil
	}

	// Fan out to all providers concurrently
	type result struct {
		offers []providers.Offer
		err    error
	}
	ch := make(chan result, len(a.providers))

	for _, p := range a.providers {
		p := p
		go func() {
			offers, err := p.SearchFlights(ctx, q)
			if err != nil {
				a.log.Warn("provider search failed",
					zap.String("provider", p.Name()),
					zap.Error(err))
			}
			ch <- result{offers: offers, err: err}
		}()
	}

	var mu sync.Mutex
	seen := map[string]struct{}{}
	var all []providers.Offer

	for range a.providers {
		r := <-ch
		for _, offer := range r.offers {
			// Deduplicate by first-leg flight number + departure time
			key := dedupeKey(offer)
			mu.Lock()
			if _, exists := seen[key]; !exists {
				seen[key] = struct{}{}
				all = append(all, offer)
			}
			mu.Unlock()
		}
	}

	ranked := rank(all)

	// Best-effort cache write
	if err := a.cache.Set(ctx, cacheKey, ranked, cacheTTL); err != nil {
		a.log.Warn("cache set failed", zap.Error(err))
	}

	return ranked, nil
}

// rank sorts by price ascending, then marks the cheapest as "BEST VALUE" via index 0.
func rank(offers []providers.Offer) []providers.Offer {
	sort.Slice(offers, func(i, j int) bool {
		return offers[i].TotalCents < offers[j].TotalCents
	})
	return offers
}

// dedupeKey builds a string that uniquely identifies a flight itinerary.
func dedupeKey(o providers.Offer) string {
	if len(o.Slices) == 0 {
		return o.ID
	}
	s := o.Slices[0]
	return s.FlightNum + "|" + s.Depart.Format(time.RFC3339)
}
