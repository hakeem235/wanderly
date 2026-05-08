package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

// Client wraps go-redis with typed get/set helpers.
type Client struct {
	rdb *redis.Client
}

// New connects to Redis at addr (e.g. "localhost:6379").
func New(addr string) *Client {
	rdb := redis.NewClient(&redis.Options{Addr: addr})
	return &Client{rdb: rdb}
}

// Ping verifies the connection.
func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

// Get retrieves a JSON-encoded value and unmarshals into dest.
// Returns (false, nil) on cache miss.
func (c *Client) Get(ctx context.Context, key string, dest interface{}) (bool, error) {
	val, err := c.rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("cache get %q: %w", key, err)
	}
	if err := json.Unmarshal(val, dest); err != nil {
		return false, fmt.Errorf("cache unmarshal %q: %w", key, err)
	}
	return true, nil
}

// Set marshals value to JSON and stores it with the given TTL.
func (c *Client) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	b, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("cache marshal %q: %w", key, err)
	}
	return c.rdb.Set(ctx, key, b, ttl).Err()
}

// FlightKey returns a canonical cache key for a flight search.
func FlightKey(origin, destination, date, cabin string, adults int) string {
	return fmt.Sprintf("flights:%s:%s:%s:%s:%d", origin, destination, date, cabin, adults)
}
