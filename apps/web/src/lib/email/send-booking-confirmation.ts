import { Resend } from "resend";
import { render } from "@react-email/render";
import { BookingConfirmationEmail, type BookingConfirmationProps } from "@/emails/booking-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Wanderly <bookings@wanderly.co>";

export async function sendBookingConfirmation(
  toEmail: string,
  props: BookingConfirmationProps
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping confirmation email");
    return;
  }

  const html = await render(BookingConfirmationEmail(props));

  const price = (props.totalCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: props.currency,
    maximumFractionDigits: 0,
  });

  const text = [
    `Booking confirmed — ${props.flightNum}: ${props.origin} → ${props.destination}`,
    "",
    `Passenger:   ${props.passengerName}`,
    `Flight:      ${props.flightNum} (${props.carrier})`,
    `Date:        ${new Date(props.depart).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    `Departs:     ${new Date(props.depart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
    `Arrives:     ${new Date(props.arrive).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
    ...(props.pnr ? [`PNR:         ${props.pnr}`] : []),
    `Booking ref: ${props.bookingId.slice(-8).toUpperCase()}`,
    `Amount paid: ${price}`,
    "",
    `View your trip: ${props.tripUrl}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      toEmail,
    subject: `Booking confirmed · ${props.flightNum} ${props.origin}→${props.destination}`,
    html,
    text,
  });

  if (error) {
    console.error("[email] send failed:", error);
    // Don't throw — booking is already confirmed, email is best-effort
  }
}
