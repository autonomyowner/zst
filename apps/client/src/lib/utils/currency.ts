/**
 * Format amount as Algerian Dinar (DZD)
 * Uses comma as decimal separator: 0,00 DZD
 */
export function formatDZD(amount: number): string {
  // Format with 2 decimal places, using comma as decimal separator
  const formatted = amount.toFixed(2).replace('.', ',')
  return `${formatted} DZD`
}

