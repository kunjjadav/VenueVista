import { SCORE_THRESHOLDS, PRICE_LABELS } from './constants'

export function getScoreClass(score) {
  if (score >= SCORE_THRESHOLDS.high) return 'score-high'
  if (score >= SCORE_THRESHOLDS.mid) return 'score-mid'
  return 'score-low'
}

export function formatPrice(level) {
  if (level == null) return '—'
  return PRICE_LABELS[level] || '—'
}

export function renderStars(rating) {
  if (!rating) return '—'
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half)
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function truncate(str, len = 40) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
