import { describe, expect, it } from 'vitest'
import { decimateTimeSeries, maxRenderPointsForWidth } from '../utils/decimate-time-series'

const series = Array.from({ length: 500 }, (_, i) => ({
  date: new Date(2024, 0, 1 + i),
  users: Math.sin(i / 7) * 100 + i
}))

describe('decimateTimeSeries', () => {
  it('returns the input untouched when it already fits', () => {
    expect(decimateTimeSeries(series, 500, ['users'])).toBe(series)
    expect(decimateTimeSeries(series, 900, ['users'])).toBe(series)
  })

  it('downsamples to the requested budget', () => {
    expect(decimateTimeSeries(series, 100, ['users'])).toHaveLength(100)
  })

  it('keeps the first and last points', () => {
    const sampled = decimateTimeSeries(series, 50, ['users'])
    expect(sampled[0]).toBe(series[0])
    expect(sampled.at(-1)).toBe(series.at(-1))
  })

  it('preserves order', () => {
    const sampled = decimateTimeSeries(series, 40, ['users'])
    const times = sampled.map((d) => d.date.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('bails out below three points', () => {
    expect(decimateTimeSeries(series, 2, ['users'])).toBe(series)
  })
})

describe('maxRenderPointsForWidth', () => {
  it('allows ~1.5 points per pixel above a 64-point floor', () => {
    expect(maxRenderPointsForWidth(0)).toBe(64)
    expect(maxRenderPointsForWidth(800)).toBe(1200)
  })
})
