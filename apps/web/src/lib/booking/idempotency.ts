/**
 * Redis-backed idempotency cache for booking requests.
 * Key: `idem:{userId}:{idempotencyKey}` → serialised BookingDoc _id
 * TTL: 24 hours
 */

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const TTL_SECONDS = 60 * 60 * 24; // 24 hours

let _client: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (_client?.isOpen) return _client;
  _client = createClient({ url: REDIS_URL });
  _client.on("error", (err) => console.error("[idempotency] redis error:", err));
  await _client.connect();
  return _client;
}

export async function getIdempotentResult(key: string): Promise<string | null> {
  try {
    const redis = await getRedis();
    return redis.get(`idem:${key}`);
  } catch {
    return null; // degrade gracefully — let the request proceed
  }
}

export async function setIdempotentResult(key: string, bookingId: string): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(`idem:${key}`, bookingId, { EX: TTL_SECONDS });
  } catch {
    // best-effort — don't fail the booking if Redis is down
  }
}
