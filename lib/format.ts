/**
 * Centralised price/currency formatting.
 * Change the symbol here when switching currencies (EGP ↔ USD).
 */
const CURRENCY_SYMBOL = '$';

export function formatPrice(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${n}`;
}
