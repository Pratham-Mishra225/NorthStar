export function formatMoney(value?: number): string {
  return typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
    : '—';
}
