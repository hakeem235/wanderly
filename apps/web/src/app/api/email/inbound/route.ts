import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, Segment, Trip, TripDocument } from "@wanderly/db";
import { parseEmail } from "@/lib/email-parser";
import { uploadBuffer } from "@/lib/storage";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

// ── Resend webhook signature verification (Svix format) ──────────────────────

function verifySignature(
  payload: string,
  req: NextRequest
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[email/inbound] RESEND_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }

  const msgId = req.headers.get("svix-id") ?? "";
  const msgTimestamp = req.headers.get("svix-timestamp") ?? "";
  const msgSignature = req.headers.get("svix-signature") ?? "";

  if (!msgId || !msgTimestamp || !msgSignature) {
    console.warn("[email/inbound] Missing Svix headers — skipping signature check");
    return true;
  }

  // Svix signs: "{svix-id}.{svix-timestamp}.{body}"
  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;

  // Secret is "whsec_" + base64-encoded key
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const computed = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Header is "v1,<base64sig> v1,<base64sig2> ..." — any match is valid
  const signatures = msgSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, "base64"), Buffer.from(computed, "base64"));
    } catch {
      return false;
    }
  });
}

// ── Resend inbound email payload types ───────────────────────────────────────

interface ResendAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

interface ResendInboundPayload {
  type: string; // "email.received"
  data: {
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: ResendAttachment[];
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Resend signature
  if (!verifySignature(rawBody, req)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ResendInboundPayload;
  try {
    payload = JSON.parse(rawBody) as ResendInboundPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { from, to, subject, text, attachments } = payload.data;

  // Extract trip ID from To address: forward+TRIPID@import.wanderly.co
  const toAddr = to[0] ?? "";
  const tripIdMatch = toAddr.match(/forward\+([a-f0-9]{24})@/i);
  if (!tripIdMatch) {
    return NextResponse.json({ error: "Could not extract trip ID from To address" }, { status: 422 });
  }
  const tripId = tripIdMatch[1]!;

  return withSpan("email.inbound", { "trip.id": tripId, "email.from": from ?? "" }, async () => {
    await connectDB();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Parse email → segment data
    const parsed = await parseEmail({
      subject,
      from,
      textBody: text ?? "",
    });

    if (!parsed) {
      // Store raw email as a NOTE segment so nothing is lost
      await Segment.create({
        tripId,
        type: "NOTE",
        title: `Email: ${subject}`,
        startsAt: new Date(),
        payload: { from, subject, raw: text?.slice(0, 500) },
      });
      return NextResponse.json({ ok: true, result: "stored_as_note" });
    }

    // Create segment from parsed data
    const segment = await Segment.create({
      tripId,
      type: parsed.type,
      title: parsed.title,
      startsAt: new Date(parsed.startsAt),
      ...(parsed.endsAt ? { endsAt: new Date(parsed.endsAt) } : {}),
      payload: { ...parsed.payload, importedFrom: "email", confidence: parsed.confidence },
    });

    // Upload PDF attachments to S3/R2 (best-effort — don't fail the whole request)
    const uploadedKeys: string[] = [];
    for (const att of attachments ?? []) {
      if (!att.contentType.includes("pdf")) continue;
      try {
        const buf = Buffer.from(att.content, "base64");
        const key = `trips/${tripId}/emails/${segment._id}/${att.filename}`;
        const uploaded = await uploadBuffer(key, buf, att.contentType);
        if (uploaded) {
          await TripDocument.create({
            tripId,
            type: "TICKET",
            s3Key: uploaded,
            filename: att.filename,
            parsed: parsed.payload,
          });
          uploadedKeys.push(uploaded);
        }
      } catch (err) {
        console.error("[email/inbound] attachment upload failed:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      segmentId: segment._id.toString(),
      type: parsed.type,
      confidence: parsed.confidence,
      attachments: uploadedKeys,
    });
  });
}
