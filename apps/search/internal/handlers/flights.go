package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/wanderly/search/internal/aggregator"
	"github.com/wanderly/search/internal/providers"
	"go.uber.org/zap"
)

// FlightHandler handles GET /v1/flights.
type FlightHandler struct {
	agg *aggregator.Aggregator
	log *zap.Logger
}

// NewFlightHandler creates a FlightHandler.
func NewFlightHandler(agg *aggregator.Aggregator, log *zap.Logger) *FlightHandler {
	return &FlightHandler{agg: agg, log: log}
}

// offerResponse is the public shape returned to the web app.
type offerResponse struct {
	ID         string          `json:"id"`
	Provider   string          `json:"provider"`
	TotalCents int             `json:"totalCents"`
	Currency   string          `json:"currency"`
	Slices     []sliceResponse `json:"slices"`
	Refundable bool            `json:"refundable"`
	BestValue  bool            `json:"bestValue"`
	ExpiresAt  string          `json:"expiresAt"`
}

type sliceResponse struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Depart      string `json:"depart"`
	Arrive      string `json:"arrive"`
	Carrier     string `json:"carrier"`
	FlightNum   string `json:"flightNum"`
	Duration    int    `json:"duration"`
	Stops       int    `json:"stops"`
}

// problemJSON writes an RFC 7807 Problem Details response.
func problemJSON(w http.ResponseWriter, status int, title, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status": status,
		"title":  title,
		"detail": detail,
	})
}

func (h *FlightHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	origin := q.Get("origin")
	destination := q.Get("destination")
	dateStr := q.Get("date")
	cabin := q.Get("cabin")
	adultsStr := q.Get("adults")

	if origin == "" || destination == "" || dateStr == "" {
		problemJSON(w, http.StatusBadRequest, "Missing parameters",
			"origin, destination, and date are required")
		return
	}

	depart, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		problemJSON(w, http.StatusBadRequest, "Invalid date",
			"date must be YYYY-MM-DD")
		return
	}

	adults := 1
	if adultsStr != "" {
		if n, err := strconv.Atoi(adultsStr); err == nil && n > 0 {
			adults = n
		}
	}

	query := providers.FlightQuery{
		Origin:      origin,
		Destination: destination,
		Depart:      depart,
		PaxAdult:    adults,
		Cabin:       cabin,
	}

	offers, err := h.agg.SearchFlights(r.Context(), query)
	if err != nil {
		h.log.Error("flight search failed", zap.Error(err))
		problemJSON(w, http.StatusBadGateway, "Search failed", err.Error())
		return
	}

	resp := make([]offerResponse, 0, len(offers))
	for i, o := range offers {
		slices := make([]sliceResponse, 0, len(o.Slices))
		for _, s := range o.Slices {
			slices = append(slices, sliceResponse{
				Origin:      s.Origin,
				Destination: s.Destination,
				Depart:      s.Depart.Format(time.RFC3339),
				Arrive:      s.Arrive.Format(time.RFC3339),
				Carrier:     s.Carrier,
				FlightNum:   s.FlightNum,
				Duration:    s.Duration,
				Stops:       len(s.Stops),
			})
		}
		resp = append(resp, offerResponse{
			ID:         o.ID,
			Provider:   o.Provider,
			TotalCents: o.TotalCents,
			Currency:   o.Currency,
			Slices:     slices,
			Refundable: o.Refundable,
			BestValue:  i == 0, // cheapest after ranking
			ExpiresAt:  o.ExpiresAt.Format(time.RFC3339),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"data":  resp,
		"count": len(resp),
	})
}
