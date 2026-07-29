import { describe, expect, it } from 'vitest'
import { getHeatmapContributionLevel } from '../utils/heatmap-utils'

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
})
