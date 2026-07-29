export const shortDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
})

export const weekdayDateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
})

export const intFmt = new Intl.NumberFormat('en-US').format

/** Axis/ticker label for either scale type: "Jun 25" for dates, raw category otherwise. */
export function xLabel(x: unknown): string {
  return x instanceof Date ? shortDateFmt.format(x) : String(x)
}

/** Compact y-axis label: 12000 → "12k". */
export function compactNumber(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
}
