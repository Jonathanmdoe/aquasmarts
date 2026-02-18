// Tanzanian Shilling formatter
export function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}

export function formatTZSCompact(amount: number): string {
  if (amount >= 1_000_000) return `TZS ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `TZS ${(amount / 1_000).toFixed(0)}K`;
  return formatTZS(amount);
}
