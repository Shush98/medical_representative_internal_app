import { format, parseISO } from 'date-fns'

export const fmtDate = (d) => {
  if (!d) return '—'
  const parsed = typeof d === 'string' ? parseISO(d) : d
  return format(parsed, 'dd MMM yyyy')
}

export const fmtMoney = (n) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
