import {
  Html, Head, Body, Container, Section, Text, Link, Hr, Preview,
} from "@react-email/components";
import * as React from "react";

export interface PriceDropAlertProps {
  passengerName: string;
  origin: string;
  destination: string;
  departDate: string;
  carrier: string;
  oldPriceCents: number;
  newPriceCents: number;
  currency: string;
  savingsCents: number;
  dropPct: number;
  searchUrl: string;
  tripUrl: string;
}

const fmt = (cents: number, currency: string) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

export function PriceDropAlertEmail({
  passengerName,
  origin,
  destination,
  departDate,
  carrier,
  oldPriceCents,
  newPriceCents,
  currency,
  savingsCents,
  dropPct,
  searchUrl,
  tripUrl,
}: PriceDropAlertProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Price dropped ${dropPct}% on your ${origin}→${destination} flight — save ${fmt(savingsCents, currency)}`}</Preview>
      <Body style={{ backgroundColor: "#FAF6EC", fontFamily: "DM Sans, Helvetica, Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 580, margin: "0 auto", padding: "40px 24px" }}>

          {/* Wordmark */}
          <Text style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#B85C38", margin: "0 0 32px" }}>
            Wander<em>ly</em>
          </Text>

          {/* Hero */}
          <Section style={{ backgroundColor: "#1F4F4A", borderRadius: 12, padding: "28px 32px", marginBottom: 24 }}>
            <Text style={{ color: "#FAF6EC", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>
              Price drop alert
            </Text>
            <Text style={{ color: "#FAF6EC", fontSize: 28, fontFamily: "Georgia, serif", margin: "0 0 4px" }}>
              {origin} → {destination}
            </Text>
            <Text style={{ color: "#88947B", fontSize: 14, margin: 0 }}>
              {carrier} · {departDate}
            </Text>
          </Section>

          {/* Savings callout */}
          <Section style={{ backgroundColor: "#EFE6D4", border: "1px solid #D8CCB3", borderRadius: 12, padding: "20px 24px", marginBottom: 24, textAlign: "center" as const }}>
            <Text style={{ color: "#5C6470", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px", fontFamily: "monospace" }}>
              You could save
            </Text>
            <Text style={{ color: "#B85C38", fontSize: 36, fontFamily: "Georgia, serif", fontWeight: "bold", margin: "0 0 4px" }}>
              {fmt(savingsCents, currency)}
            </Text>
            <Text style={{ color: "#5C6470", fontSize: 13, margin: 0 }}>
              Price dropped {dropPct}% — from{" "}
              <span style={{ textDecoration: "line-through" }}>{fmt(oldPriceCents, currency)}</span>
              {" "}to <strong style={{ color: "#15191F" }}>{fmt(newPriceCents, currency)}</strong>
            </Text>
          </Section>

          <Text style={{ color: "#2A2F38", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
            Hi {passengerName}, the price on a flight you saved has dropped. Prices fluctuate — lock this in before it rises again.
          </Text>

          {/* CTA */}
          <Section style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <Link
              href={searchUrl}
              style={{
                backgroundColor: "#B85C38",
                color: "#FAF6EC",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Book now at {fmt(newPriceCents, currency)} →
            </Link>
          </Section>

          <Hr style={{ borderColor: "#D8CCB3", margin: "0 0 24px" }} />

          <Text style={{ color: "#5C6470", fontSize: 12, margin: "0 0 8px" }}>
            <Link href={tripUrl} style={{ color: "#B85C38" }}>View your trip</Link>
            {" "}· Wanderly automatically monitors prices for saved quotes. Prices may vary at time of booking.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
