import { describe, expect, it } from 'vitest'
import { compactNumber } from '../utils/chart-formatters'

describe('compactNumber', () => {
  it('leaves values below 1000 as-is', () => {
    expect(compactNumber(0)).toBe('0')
    expect(compactNumber(620)).toBe('620')
  })

  it('compacts thousands to k, rounded', () => {
    expect(compactNumber(1000)).toBe('1k')
    expect(compactNumber(12_000)).toBe('12k')
    expect(compactNumber(15_500)).toBe('16k')
  })
})
