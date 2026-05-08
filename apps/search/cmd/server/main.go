package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/wanderly/search/internal/aggregator"
	"github.com/wanderly/search/internal/cache"
	"github.com/wanderly/search/internal/handlers"
	"github.com/wanderly/search/internal/providers"
	"github.com/wanderly/search/internal/providers/amadeus"
	"go.uber.org/zap"
)

func main() {
	log, _ := zap.NewProduction()
	defer log.Sync() //nolint:errcheck

	// ── Config from env ────────────────────────────────────────────────────────
	port := getEnv("PORT", "8080")
	redisAddr := getEnv("REDIS_ADDR", "127.0.0.1:6379")
	amadeusID := getEnv("AMADEUS_CLIENT_ID", "")
	amadeusSecret := getEnv("AMADEUS_CLIENT_SECRET", "")
	amadeusBase := getEnv("AMADEUS_BASE_URL", "") // blank = sandbox

	// ── Dependencies ───────────────────────────────────────────────────────────
	redisClient := cache.New(redisAddr)
	if err := redisClient.Ping(context.Background()); err != nil {
		log.Warn("redis ping failed — results will not be cached", zap.Error(err))
	}

	var ps []providers.Provider
	if amadeusID != "" && amadeusSecret != "" {
		ps = append(ps, amadeus.New(amadeusID, amadeusSecret, amadeusBase, log))
		log.Info("amadeus provider enabled")
	} else {
		log.Warn("AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET not set — no providers active")
	}

	agg := aggregator.New(ps, redisClient, log)

	// ── Router ─────────────────────────────────────────────────────────────────
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"ok":true,"service":"wanderly-search"}`)
	})

	r.Get("/v1/flights", handlers.NewFlightHandler(agg, log).ServeHTTP)

	// ── Server ─────────────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Info("starting wanderly-search", zap.String("port", port))

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("server error", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
