export const API_BASE = '/api'

export const PRICE_LABELS = ['Free', '$', '$$', '$$$', '$$$$']

export const CUISINE_OPTIONS = [
  'indian', 'chinese', 'italian', 'japanese', 'mexican',
  'thai', 'korean', 'french', 'pizza', 'seafood',
  'steakhouse', 'sushi', 'burger', 'cafe', 'bakery',
  'mediterranean', 'vietnamese', 'american', 'turkish', 'lebanese',
]

export const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 } // Ahmedabad

export const SCORE_THRESHOLDS = {
  high: 65,
  mid: 35,
}

export const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
]
