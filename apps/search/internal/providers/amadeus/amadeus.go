package amadeus

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/wanderly/search/internal/providers"
	"go.uber.org/zap"
)

const (
	sandboxBase    = "https://test.api.amadeus.com"
	tokenEndpoint  = "/v1/security/oauth2/token"
	flightEndpoint = "/v2/shopping/flight-offers"
)

// Client implements providers.Provider for Amadeus.
type Client struct {
	clientID     string
	clientSecret string
	baseURL      string
	log          *zap.Logger
	httpClient   *http.Client

	mu          sync.Mutex
	accessToken string
	tokenExpiry time.Time
}

// New creates an Amadeus client. Set baseURL to sandboxBase for testing.
func New(clientID, clientSecret, baseURL string, log *zap.Logger) *Client {
	if baseURL == "" {
		baseURL = sandboxBase
	}
	return &Client{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      baseURL,
		log:          log,
		httpClient:   &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Name() string { return "amadeus" }

// ── OAuth token management ────────────────────────────────────────────────────

func (c *Client) ensureToken(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if time.Now().Before(c.tokenExpiry.Add(-30 * time.Second)) {
		return nil
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", c.clientID)
	form.Set("client_secret", c.clientSecret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.baseURL+tokenEndpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("amadeus token request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("amadeus token error %d: %s", resp.StatusCode, body)
	}

	var tok struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &tok); err != nil {
		return fmt.Errorf("amadeus token parse: %w", err)
	}

	c.accessToken = tok.AccessToken
	c.tokenExpiry = time.Now().Add(time.Duration(tok.ExpiresIn) * time.Second)
	return nil
}

// ── SearchFlights ─────────────────────────────────────────────────────────────

// amadeusOffer is the raw shape returned by the Amadeus v2 API.
type amadeusOffer struct {
	ID                     string `json:"id"`
	Source                 string `json:"source"`
	InstantTicketingRequired bool  `json:"instantTicketingRequired"`
	Price                  struct {
		Currency   string `json:"currency"`
		GrandTotal string `json:"grandTotal"`
	} `json:"price"`
	Itineraries []struct {
		Duration string `json:"duration"`
		Segments []struct {
			Departure struct {
				IATACode string `json:"iataCode"`
				At       string `json:"at"`
			} `json:"departure"`
			Arrival struct {
				IATACode string `json:"iataCode"`
				At       string `json:"at"`
			} `json:"arrival"`
			CarrierCode string `json:"carrierCode"`
			Number      string `json:"number"`
			Duration    string `json:"duration"`
		} `json:"segments"`
	} `json:"itineraries"`
	ValidatingAirlineCodes []string `json:"validatingAirlineCodes"`
}

type searchResponse struct {
	Data []amadeusOffer `json:"data"`
}

func (c *Client) SearchFlights(ctx context.Context, q providers.FlightQuery) ([]providers.Offer, error) {
	if err := c.ensureToken(ctx); err != nil {
		return nil, err
	}

	params := url.Values{}
	params.Set("originLocationCode", q.Origin)
	params.Set("destinationLocationCode", q.Destination)
	params.Set("departureDate", q.Depart.Format("2006-01-02"))
	params.Set("adults", fmt.Sprintf("%d", max(q.PaxAdult, 1)))
	params.Set("currencyCode", "USD")
	params.Set("max", "15")
	if q.Return != nil {
		params.Set("returnDate", q.Return.Format("2006-01-02"))
	}
	if q.Cabin != "" {
		params.Set("travelClass", cabinCode(q.Cabin))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		c.baseURL+flightEndpoint+"?"+params.Encode(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("amadeus search: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("amadeus search error %d: %s", resp.StatusCode, body)
	}

	var sr searchResponse
	if err := json.Unmarshal(body, &sr); err != nil {
		return nil, fmt.Errorf("amadeus search parse: %w", err)
	}

	offers := make([]providers.Offer, 0, len(sr.Data))
	for _, ao := range sr.Data {
		offer, err := mapOffer(ao)
		if err != nil {
			c.log.Warn("skipping unmappable offer", zap.String("id", ao.ID), zap.Error(err))
			continue
		}
		raw, _ := json.Marshal(ao)
		offer.Raw = raw
		offers = append(offers, offer)
	}
	return offers, nil
}

func (c *Client) QuoteOffer(ctx context.Context, offerID string) (*providers.Offer, error) {
	// Amadeus flight-offers/pricing endpoint
	if err := c.ensureToken(ctx); err != nil {
		return nil, err
	}

	body := fmt.Sprintf(`{"data":{"type":"flight-offers-pricing","flightOffers":[{"id":"%s"}]}}`, offerID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.baseURL+"/v1/shopping/flight-offers/pricing",
		strings.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("amadeus quote: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("amadeus quote error %d: %s", resp.StatusCode, respBody)
	}

	var result struct {
		Data struct {
			FlightOffers []amadeusOffer `json:"flightOffers"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("amadeus quote parse: %w", err)
	}
	if len(result.Data.FlightOffers) == 0 {
		return nil, fmt.Errorf("amadeus quote: no offers returned")
	}

	offer, err := mapOffer(result.Data.FlightOffers[0])
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(result.Data.FlightOffers[0])
	offer.Raw = raw
	return &offer, nil
}

func (c *Client) Confirm(_ context.Context, _ string, _ []providers.Passenger, _ providers.PaymentRef) (*providers.ConfirmedBooking, error) {
	// Phase 5 — booking flow
	return nil, fmt.Errorf("confirm not implemented yet")
}

func (c *Client) Cancel(_ context.Context, _ string) error {
	// Phase 5
	return fmt.Errorf("cancel not implemented yet")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func mapOffer(ao amadeusOffer) (providers.Offer, error) {
	var priceF float64
	if _, err := fmt.Sscanf(ao.Price.GrandTotal, "%f", &priceF); err != nil {
		return providers.Offer{}, fmt.Errorf("bad price %q: %w", ao.Price.GrandTotal, err)
	}
	totalCents := int(priceF * 100)

	var slices []providers.Slice
	for _, itin := range ao.Itineraries {
		for _, seg := range itin.Segments {
			dep, _ := time.Parse(time.RFC3339, seg.Departure.At)
			arr, _ := time.Parse(time.RFC3339, seg.Arrival.At)
			slices = append(slices, providers.Slice{
				Origin:      seg.Departure.IATACode,
				Destination: seg.Arrival.IATACode,
				Depart:      dep,
				Arrive:      arr,
				Carrier:     seg.CarrierCode,
				FlightNum:   seg.CarrierCode + seg.Number,
			})
		}
	}

	return providers.Offer{
		ID:         ao.ID,
		Provider:   "amadeus",
		TotalCents: totalCents,
		Currency:   ao.Price.Currency,
		Slices:     slices,
		ExpiresAt:  time.Now().Add(30 * time.Minute),
	}, nil
}

func cabinCode(cabin string) string {
	switch strings.ToLower(cabin) {
	case "premium":
		return "PREMIUM_ECONOMY"
	case "business":
		return "BUSINESS"
	case "first":
		return "FIRST"
	default:
		return "ECONOMY"
	}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
