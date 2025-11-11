/**
 * Format amount as Algerian Dinar (DA)
 * Uses comma as decimal separator: 0,00 DA
 */
export function formatDZD(amount: number): string {
  // Format with 2 decimal places, using comma as decimal separator
  const formatted = amount.toFixed(2).replace('.', ',')
  return `${formatted} DA`
}

/**
 * Format amount as Algerian Dinar (DA) - simple version
 * Returns formatted string with DA suffix
 */
export function formatCurrency(amount: number): string {
  return formatDZD(amount)
}









