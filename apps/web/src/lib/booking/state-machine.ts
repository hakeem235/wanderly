/**
 * Booking state machine — only forward transitions allowed.
 * Out-of-order events are silently dropped (logged as warnings).
 */

export type BookingStatus = "QUOTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

// Valid forward transitions
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  QUOTED:    ["PENDING", "CANCELLED"],
  PENDING:   ["CONFIRMED", "FAILED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  FAILED:    [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking transition: ${from} → ${to}`);
  }
}
