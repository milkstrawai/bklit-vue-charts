import { describe, expect, it } from 'vitest'
import { buildHeatmapColorScale, defaultHeatmapColorScale } from '../utils/heatmap-colors'
import { formatHeatmapContributionLabel, getHeatmapContributionLevel } from '../utils/heatmap-utils'

describe('getHeatmapContributionLevel', () => {
  it('maps zero and negatives to level 0', () => {
    expect(getHeatmapContributionLevel(0)).toBe(0)
    expect(getHeatmapContributionLevel(-1)).toBe(0)
  })

  it('maps 1–3 to their own level', () => {
    expect(getHeatmapContributionLevel(1)).toBe(1)
    expect(getHeatmapContributionLevel(2)).toBe(2)
    expect(getHeatmapContributionLevel(3)).toBe(3)
  })

  it('caps 4 and above at level 4', () => {
    expect(getHeatmapContributionLevel(4)).toBe(4)
    expect(getHeatmapContributionLevel(9)).toBe(4)
  })

  it('floors fractions to their level', () => {
    expect(getHeatmapContributionLevel(0.5)).toBe(0)
    expect(getHeatmapContributionLevel(2.5)).toBe(2)
    expect(getHeatmapContributionLevel(1240.5)).toBe(4)
  })
})

describe('formatHeatmapContributionLabel', () => {
  it('singularizes a count of one', () => {
    expect(formatHeatmapContributionLabel(1)).toBe('1 contribution')
  })

  it('pluralizes every other count', () => {
    expect(formatHeatmapContributionLabel(0)).toBe('0 contributions')
    expect(formatHeatmapContributionLabel(12)).toBe('12 contributions')
  })
})

describe('buildHeatmapColorScale', () => {
  const COLORS = ['c0', 'c1', 'c2', 'c3', 'c4'] as const

  it('buckets a count onto its level color', () => {
    expect(buildHeatmapColorScale(COLORS)(0)).toBe('c0')
    expect(buildHeatmapColorScale(COLORS)(3)).toBe('c3')
    expect(buildHeatmapColorScale(COLORS)(99)).toBe('c4')
  })

  it('treats null and undefined as empty', () => {
    expect(buildHeatmapColorScale(COLORS)(null)).toBe('c0')
    expect(buildHeatmapColorScale(COLORS)(undefined)).toBe('c0')
  })
})

describe('defaultHeatmapColorScale', () => {
  it('maps onto the --chart-scale-* tokens', () => {
    expect(defaultHeatmapColorScale(0)).toBe('var(--chart-scale-01)')
    expect(defaultHeatmapColorScale(4)).toBe('var(--chart-scale-05)')
  })
})
