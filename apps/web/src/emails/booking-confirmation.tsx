import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Hr,
  Link,
  Font,
} from "@react-email/components";

export interface BookingConfirmationProps {
  passengerName: string;
  bookingId:     string;
  pnr?:          string;
  flightNum:     string;
  origin:        string;
  destination:   string;
  depart:        string; // ISO string
  arrive:        string; // ISO string
  carrier:       string;
  totalCents:    number;
  currency:      string;
  tripTitle:     string;
  tripUrl:       string;
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-US", opts);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtPrice(cents: number, currency: string) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function BookingConfirmationEmail({
  passengerName,
  bookingId,
  pnr,
  flightNum,
  origin,
  destination,
  depart,
  arrive,
  carrier,
  totalCents,
  currency,
  tripTitle,
  tripUrl,
}: BookingConfirmationProps) {
  const departDate = fmt(depart, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const price      = fmtPrice(totalCents, currency);

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Helvetica"
          webFont={{ url: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZ2IHTWEBlwu8Q.woff2", format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: "#F5EFE3", fontFamily: "'DM Sans', Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>

          {/* Wordmark */}
          <Text style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#15191F", margin: "0 0 32px", fontStyle: "italic" }}>
            Wanderly
          </Text>

          {/* Hero */}
          <Section style={{ backgroundColor: "#B85C38", borderRadius: 16, padding: "32px 28px", marginBottom: 24 }}>
            <Text style={{ color: "#FAF6EC", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Booking confirmed
            </Text>
            <Text style={{ color: "#FAF6EC", fontSize: 32, fontFamily: "Georgia, serif", fontStyle: "italic", margin: "0 0 4px", lineHeight: 1.1 }}>
              {origin} → {destination}
            </Text>
            <Text style={{ color: "#EFE6D4", fontSize: 14, margin: "8px 0 0" }}>
              {departDate}
            </Text>
          </Section>

          {/* Boarding pass strip */}
          <Section style={{ backgroundColor: "#FAF6EC", borderRadius: 16, border: "1px solid #D8CCB3", padding: "24px 28px", marginBottom: 24 }}>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
                  Flight
                </Text>
                <Text style={{ fontSize: 18, color: "#15191F", margin: 0, fontWeight: 600 }}>
                  {flightNum}
                </Text>
                <Text style={{ fontSize: 12, color: "#5C6470", margin: "2px 0 0" }}>{carrier}</Text>
              </Column>
              <Column style={{ width: "50%", textAlign: "right" as const }}>
                {pnr && (
                  <>
                    <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
                      PNR
                    </Text>
                    <Text style={{ fontSize: 18, color: "#B85C38", margin: 0, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}>
                      {pnr}
                    </Text>
                  </>
                )}
              </Column>
            </Row>

            <Hr style={{ border: "none", borderTop: "1px dashed #D8CCB3", margin: "20px 0" }} />

            <Row>
              <Column style={{ width: "40%" }}>
                <Text style={{ fontSize: 28, color: "#15191F", fontFamily: "monospace", fontWeight: 700, margin: 0 }}>
                  {origin}
                </Text>
                <Text style={{ fontSize: 13, color: "#5C6470", margin: "2px 0 0" }}>
                  {fmtTime(depart)}
                </Text>
              </Column>
              <Column style={{ width: "20%", textAlign: "center" as const }}>
                <Text style={{ fontSize: 18, color: "#D8CCB3", margin: 0 }}>✈</Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" as const }}>
                <Text style={{ fontSize: 28, color: "#15191F", fontFamily: "monospace", fontWeight: 700, margin: 0 }}>
                  {destination}
                </Text>
                <Text style={{ fontSize: 13, color: "#5C6470", margin: "2px 0 0" }}>
                  {fmtTime(arrive)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Details */}
          <Section style={{ backgroundColor: "#FAF6EC", borderRadius: 16, border: "1px solid #D8CCB3", padding: "20px 28px", marginBottom: 24 }}>
            <Row style={{ marginBottom: 12 }}>
              <Column style={{ width: "50%" }}>
                <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>Passenger</Text>
                <Text style={{ fontSize: 14, color: "#15191F", margin: 0 }}>{passengerName}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>Trip</Text>
                <Text style={{ fontSize: 14, color: "#15191F", margin: 0 }}>{tripTitle}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>Booking ref</Text>
                <Text style={{ fontSize: 14, color: "#15191F", fontFamily: "monospace", margin: 0 }}>{bookingId.slice(-8).toUpperCase()}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={{ fontSize: 11, color: "#5C6470", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>Amount paid</Text>
                <Text style={{ fontSize: 14, color: "#15191F", margin: 0, fontWeight: 600 }}>{price}</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <Link
              href={tripUrl}
              style={{
                backgroundColor: "#B85C38",
                color: "#FAF6EC",
                padding: "12px 28px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View your trip →
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={{ border: "none", borderTop: "1px solid #D8CCB3", marginBottom: 20 }} />
          <Text style={{ fontSize: 11, color: "#88947B", textAlign: "center" as const, margin: 0 }}>
            Wanderly · Your travel, organized · Questions? Reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BookingConfirmationEmail;
