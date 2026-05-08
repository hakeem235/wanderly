import Anthropic from "@anthropic-ai/sdk";

export type SegmentType =
  | "FLIGHT"
  | "LODGING"
  | "ACTIVITY"
  | "TRANSFER"
  | "FOOD"
  | "NOTE";

export interface ParsedSegment {
  type: SegmentType;
  title: string;
  startsAt: string;
  endsAt?: string;
  payload: Record<string, unknown>;
  confidence: "high" | "low";
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Strip leading weekday name so Date() can parse "Saturday, August 13, 2026" */
function normalizeDate(s: string): string {
  return s.replace(/^[A-Za-z]+,\s*/, "").trim();
}

function safeDate(s: string | undefined): string | null {
  if (!s) return null;
  const d = new Date(normalizeDate(s));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ── Regex parsers ─────────────────────────────────────────────────────────────

function parseBookingCom(text: string, sender: string): ParsedSegment | null {
  if (!/booking\.com/i.test(text) && !/booking\.com/i.test(sender) && !/booking confirmation/i.test(text)) return null;

  // Match hotel name — stop at "is confirmed", "!", newline, or comma
  const hotelMatch = text.match(
    /(?:your reservation at|staying at|property:?)\s*([^!\n\r,]+?)(?:\s+is\s+confirmed|[!\n\r,]|$)/i
  );
  const checkIn = text.match(
    /check[- ]?in[:\s]+([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  );
  const checkOut = text.match(
    /check[- ]?out[:\s]+([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  );
  const confNum = text.match(/confirmation[:\s#]+([A-Z0-9-]{5,15})/i);

  if (!hotelMatch?.[1] || !checkIn?.[1]) return null;
  const startsAt = safeDate(checkIn[1]);
  if (!startsAt) return null;
  const endsAt = safeDate(checkOut?.[1]);

  return {
    type: "LODGING",
    title: hotelMatch[1].trim(),
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    payload: { confirmationNumber: confNum?.[1], provider: "Booking.com" },
    confidence: "high",
  };
}

function parseFlight(text: string, sender: string): ParsedSegment | null {
  const airlines = ["saudia", "saudi arabian", "sv ", "emirates", "ek ", "flyadeal", "flynas", "lufthansa", "turkish airlines"];
  const isFlight =
    /flight\s+confirm|boarding\s+pass|e-?ticket|itinerary\s+receipt/i.test(text) ||
    airlines.some((a) => text.toLowerCase().includes(a));
  if (!isFlight) return null;

  const flightNum = text.match(/\b([A-Z]{1,2})\s?(\d{2,4})\b/);
  const route = text.match(/\b([A-Z]{3})\s*(?:[\u2192\u2014\-]|->|to)\s*([A-Z]{3})\b/);

  // "Departure date: Aug 12, 2026" OR "Departure: Aug 12, 2026"
  const depDate = text.match(
    /(?:departure\s+date|departure|departs?|flight\s+date)\s*:\s*([A-Za-z]+,?\s*[A-Za-z]*\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i
  );
  const depTime = text.match(/(?:departure\s+time|departs?)\s*:\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  const pnr = text.match(/\b(?:PNR|booking\s+ref(?:erence)?|reservation)\s*[:\s#]*([A-Z0-9]{5,7})\b/i);

  if (!depDate?.[1]) return null;
  const startsAt = safeDate(`${depDate[1]} ${depTime?.[1] ?? "00:00"}`);
  if (!startsAt) return null;

  const flightLabel = flightNum ? `${flightNum[1]}${flightNum[2]}` : undefined;
  const routeLabel = route ? `${route[1]}\u2192${route[2]}` : undefined;

  return {
    type: "FLIGHT",
    title: [
      flightLabel ? `Flight ${flightLabel}` : "Flight",
      routeLabel,
    ]
      .filter(Boolean)
      .join(" \u00b7 "),
    startsAt,
    payload: {
      flightNumber: flightLabel,
      origin: route?.[1],
      destination: route?.[2],
      pnr: pnr?.[1],
      airline: sender,
    },
    confidence: "high",
  };
}

function parseAirbnb(text: string, sender: string): ParsedSegment | null {
  if (!/airbnb/i.test(text) && !/airbnb/i.test(sender)) return null;

  const propMatch = text.match(
    /(?:you'?re going to|staying at|your reservation at)\s+(.+?)(?:\n|,\s*[A-Z])/i
  );
  const checkIn = text.match(
    /check-?in\s*[:\-]\s*([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2},?\s*\d{4})/i
  );
  const checkOut = text.match(
    /check-?out\s*[:\-]\s*([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2},?\s*\d{4})/i
  );
  const confCode = text.match(/confirmation\s+code\s*[:\-]\s*([A-Z0-9]+)/i);

  if (!checkIn?.[1]) return null;
  const startsAt = safeDate(checkIn[1]);
  if (!startsAt) return null;
  const endsAt = safeDate(checkOut?.[1]);

  return {
    type: "LODGING",
    title: propMatch?.[1]?.trim() ?? "Airbnb stay",
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    payload: { confirmationCode: confCode?.[1], provider: "Airbnb" },
    confidence: "high",
  };
}

function parseViator(text: string, sender: string): ParsedSegment | null {
  if (!/viator/i.test(text) && !/viator/i.test(sender)) return null;

  // Title from subject line (more reliable than body)
  const subjectMatch = text.match(/booking\s+confirmed?\s*[–\-]\s*(.+?)(?:\n|$)/i);
  const bodyActivity = text.match(/(?:^activity|^tour|^experience)\s*:\s*(.+?)(?:\n|$)/im);
  const dateMatch = text.match(
    /(?:^date|activity\s+date)\s*:\s*([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2},?\s*\d{4})/im
  );
  const bookingRef = text.match(/booking\s+ref(?:erence)?\s*[:\-]\s*([A-Z0-9-]+)/i);

  if (!dateMatch?.[1]) return null;
  const startsAt = safeDate(dateMatch[1]);
  if (!startsAt) return null;

  return {
    type: "ACTIVITY",
    title: (subjectMatch?.[1] ?? bodyActivity?.[1] ?? "Viator activity").trim(),
    startsAt,
    payload: { bookingRef: bookingRef?.[1], provider: "Viator" },
    confidence: "high",
  };
}

// ── Claude fallback ───────────────────────────────────────────────────────────

async function parseWithClaude(
  subject: string,
  text: string
): Promise<ParsedSegment | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.warn("[email-parser] ANTHROPIC_API_KEY not set — skipping Claude fallback");
    return null;
  }
  const client = new Anthropic({ apiKey: key });

  const prompt = `You are parsing a travel confirmation email to extract booking details.

Email subject: ${subject}
Email body (first 3000 chars):
${text.slice(0, 3000)}

Extract the booking and return ONLY valid JSON matching this shape (no prose):
{
  "type": "FLIGHT" | "LODGING" | "ACTIVITY" | "TRANSFER" | "FOOD" | "NOTE",
  "title": "short human-readable title",
  "startsAt": "ISO 8601 datetime string",
  "endsAt": "ISO 8601 datetime string or null",
  "payload": { ...any relevant fields like confirmationNumber, airline, hotel, etc. }
}

If this is not a travel confirmation email, return: null`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  const raw = block?.type === "text" ? block.text.trim() : "";
  if (!raw || raw === "null") return null;

  try {
    const parsed = JSON.parse(raw) as {
      type: SegmentType;
      title: string;
      startsAt: string;
      endsAt?: string | null;
      payload: Record<string, unknown>;
    };
    return {
      type: parsed.type,
      title: parsed.title,
      startsAt: parsed.startsAt,
      ...(parsed.endsAt ? { endsAt: parsed.endsAt } : {}),
      payload: parsed.payload ?? {},
      confidence: "low",
    };
  } catch {
    console.error("[email-parser] Claude returned invalid JSON:", raw);
    return null;
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function parseEmail(opts: {
  subject: string;
  from: string;
  textBody: string;
}): Promise<ParsedSegment | null> {
  const { subject, from, textBody } = opts;
  const combined = `${subject}\n${textBody}`;

  const result =
    parseBookingCom(combined, from) ??
    parseFlight(combined, from) ??
    parseAirbnb(combined, from) ??
    parseViator(combined, from);

  if (result) return result;

  return parseWithClaude(subject, textBody);
}
