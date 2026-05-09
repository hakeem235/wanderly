import { Resend } from "resend";
import { render } from "@react-email/render";
import { PriceDropAlertEmail, type PriceDropAlertProps } from "@/emails/price-drop-alert";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Wanderly <alerts@wanderly.co>";

export async function sendPriceDropAlert(
  toEmail: string,
  props: PriceDropAlertProps
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping price drop alert");
    return;
  }

  const html = await render(PriceDropAlertEmail(props));

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      toEmail,
    subject: `Price dropped ${props.dropPct}% · ${props.origin}→${props.destination} now ${(props.newPriceCents / 100).toLocaleString("en-US", { style: "currency", currency: props.currency, maximumFractionDigits: 0 })}`,
    html,
    text: [
      `Price drop alert — ${props.origin} → ${props.destination}`,
      "",
      `Good news! The price dropped ${props.dropPct}% on a flight you saved.`,
      `Was: ${(props.oldPriceCents / 100).toFixed(2)} ${props.currency}`,
      `Now: ${(props.newPriceCents / 100).toFixed(2)} ${props.currency}`,
      `You save: ${(props.savingsCents / 100).toFixed(2)} ${props.currency}`,
      "",
      `Search: ${props.searchUrl}`,
      `Trip: ${props.tripUrl}`,
    ].join("\n"),
  });

  if (error) {
    console.error("[email] price drop alert send failed:", error);
  }
}
