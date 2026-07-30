import { describe, expect, it } from 'vitest'
import { intFmt, longXLabel, xLabel } from '../utils/chart-formatters'

const sampleNumbers = [0, 42, 1234, 1_234_567, -9876.5]

describe('intFmt', () => {
  for (const value of sampleNumbers) {
    it(`matches toLocaleString for ${value}`, () => {
      expect(intFmt(value)).toBe(value.toLocaleString('en-US'))
    })
  }

  it('is a reusable formatter function', () => {
    const formatValue = intFmt
    expect(formatValue(1000)).toBe((1000).toLocaleString('en-US'))
  })
})

describe('xLabel', () => {
  it('formats a Date as short month + day', () => {
    expect(xLabel(new Date(2026, 5, 25))).toBe('Jun 25')
  })

  it('passes category strings through unchanged', () => {
    expect(xLabel('Jan')).toBe('Jan')
  })

  it('stringifies non-date, non-string values', () => {
    expect(xLabel(42)).toBe('42')
  })
})

describe('longXLabel', () => {
  it('formats a Date as weekday + short month + day', () => {
    expect(longXLabel(new Date(2026, 5, 25))).toBe('Thu, Jun 25')
  })

  it('passes category strings through unchanged', () => {
    expect(longXLabel('Jan')).toBe('Jan')
  })

  it('stringifies non-date, non-string values', () => {
    expect(longXLabel(42)).toBe('42')
  })
})
