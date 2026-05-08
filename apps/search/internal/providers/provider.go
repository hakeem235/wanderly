package providers

import (
	"context"
	"encoding/json"
	"time"
)

// FlightQuery holds search parameters for a flight query.
type FlightQuery struct {
	Origin      string     // IATA
	Destination string     // IATA
	Depart      time.Time
	Return      *time.Time // nil for one-way
	PaxAdult    int
	PaxChild    int
	Cabin       string // economy | premium | business | first
}

// BaggageRules describes included baggage.
type BaggageRules struct {
	CarryOn    int
	Checked    int
	KgIncluded int
}

// Slice is one leg of a flight offer.
type Slice struct {
	Origin      string
	Destination string
	Depart      time.Time
	Arrive      time.Time
	Carrier     string
	FlightNum   string
	Stops       []string
	Duration    int // minutes
}

// Offer is a single bookable flight from a provider.
type Offer struct {
	ID         string
	Provider   string
	TotalCents int
	Currency   string
	Slices     []Slice
	Baggage    BaggageRules
	Refundable bool
	ExpiresAt  time.Time
	Raw        json.RawMessage
}

// Passenger holds traveler details used at booking time.
type Passenger struct {
	FirstName   string
	LastName    string
	DateOfBirth string // YYYY-MM-DD
	PassportNum string
	Nationality string
}

// PaymentRef is an opaque reference to a captured payment (e.g. Stripe PaymentIntent ID).
type PaymentRef struct {
	Provider  string // "stripe"
	Reference string
}

// ConfirmedBooking is the result of a successful provider booking.
type ConfirmedBooking struct {
	BookingRef string
	PNR        string
	TicketURL  string
	Raw        json.RawMessage
}

// Provider is the interface every flight provider adapter must implement.
type Provider interface {
	Name() string
	SearchFlights(ctx context.Context, q FlightQuery) ([]Offer, error)
	QuoteOffer(ctx context.Context, offerID string) (*Offer, error)
	Confirm(ctx context.Context, offerID string, pax []Passenger, payment PaymentRef) (*ConfirmedBooking, error)
	Cancel(ctx context.Context, bookingRef string) error
}
