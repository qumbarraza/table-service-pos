export const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})

export const dateTime = new Intl.DateTimeFormat('en-PK', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCurrency(value) {
  return currency.format(Number(value || 0))
}

export function formatDateTime(value) {
  if (!value) return '-'
  return dateTime.format(new Date(value))
}
