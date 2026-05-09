/**
 * Format a cent-denominated amount into a localised currency string.
 * Uses Intl.NumberFormat — no floats, no manual concatenation.
 *
 * @example formatCurrency(150000, "USD") → "$1,500"
 * @example formatCurrency(150000, "SAR") → "SAR 1,500"
 */
export function formatCurrency(
  cents: number,
  currency: string,
  locale = "en-US"
): string {
  return (cents / 100).toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}
