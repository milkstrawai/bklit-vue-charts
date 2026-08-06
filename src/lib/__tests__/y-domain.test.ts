import { describe, expect, it } from 'vitest'
import {
  lerpYDomain,
  niceYDomain,
  resolveTimeSeriesYDomain,
  shouldTweenYDomain,
  yDomainsEqual
} from '../utils/y-domain'

describe('resolveTimeSeriesYDomain', () => {
  it('is zero-based with 10% headroom while all values are non-negative', () => {
    const [lo, hi] = resolveTimeSeriesYDomain(80, 120)
    expect(lo).toBe(0)
    expect(hi).toBeCloseTo(132)
    expect(resolveTimeSeriesYDomain(0, 50)[1]).toBeCloseTo(55)
  })

  it('floats with 5% padding once a value dips below zero', () => {
    expect(resolveTimeSeriesYDomain(-20, 50)).toEqual([-23.5, 53.5])
  })

  it('falls back to [0, 100] without numeric data or with an all-zero series', () => {
    expect(resolveTimeSeriesYDomain(undefined, undefined)).toEqual([0, 100])
    expect(resolveTimeSeriesYDomain(0, 0)).toEqual([0, 100])
  })

  it('pads by one unit when a negative series is flat', () => {
    expect(resolveTimeSeriesYDomain(-5, -5)).toEqual([-6, -4])
  })
})

describe('niceYDomain', () => {
  it('keeps a zero floor and rounds only the top', () => {
    expect(niceYDomain([0, 132])).toEqual([0, 140])
  })
})

describe('shouldTweenYDomain', () => {
  it('skips endpoint moves below 2% of the span', () => {
    expect(shouldTweenYDomain([0, 100], [0, 101])).toBe(false)
    expect(shouldTweenYDomain([0, 100], [0, 140])).toBe(true)
  })
})

describe('lerpYDomain', () => {
  it('interpolates both endpoints', () => {
    expect(lerpYDomain([0, 100], [10, 200], 0.5)).toEqual([5, 150])
  })
})

describe('yDomainsEqual', () => {
  it('compares axis maps by endpoints', () => {
    expect(yDomainsEqual({ left: [0, 1] }, { left: [0, 1] })).toBe(true)
    expect(yDomainsEqual({ left: [0, 1] }, { left: [0, 2] })).toBe(false)
    expect(yDomainsEqual({ left: [0, 1] }, { left: [0, 1], right: [0, 1] })).toBe(false)
  })
})
