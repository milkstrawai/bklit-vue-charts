import { describe, expect, it } from 'vitest'
import {
  buildHeatmapFillScale,
  HEATMAP_DEFAULT_LEVEL_STYLES,
  heatmapLevelCellFillOpacity,
  heatmapLevelPatternId,
  heatmapLevelPatternRenderOptions,
  isHeatmapLevelPattern,
  levelColorsFromStyles,
  levelStylesFromColors,
  resolveHeatmapLevelStyles
} from '../utils/heatmap-colors'
import type { HeatmapLevelColors, HeatmapLevelStyles } from '../utils/heatmap-colors'

const COLORS: HeatmapLevelColors = ['c0', 'c1', 'c2', 'c3', 'c4']

const PATTERNED = [
  { color: 'c0' },
  { color: 'c1' },
  { color: 'c2' },
  { color: 'c3' },
  { color: 'c4', fillMode: 'pattern', pattern: 'diagonal', patternOpacity: 0.5 }
] as unknown as HeatmapLevelStyles

describe('isHeatmapLevelPattern', () => {
  it('needs both pattern fill mode and a real preset', () => {
    expect(isHeatmapLevelPattern({ color: 'c', fillMode: 'pattern', pattern: 'dots' })).toBe(true)
    expect(isHeatmapLevelPattern({ color: 'c', fillMode: 'pattern', pattern: 'none' })).toBe(false)
    expect(isHeatmapLevelPattern({ color: 'c', fillMode: 'solid', pattern: 'dots' })).toBe(false)
    expect(isHeatmapLevelPattern({ color: 'c' })).toBe(false)
  })
})

describe('resolveHeatmapLevelStyles', () => {
  it('prefers levelStyles over levelColors', () => {
    expect(resolveHeatmapLevelStyles(COLORS, PATTERNED)).toBe(PATTERNED)
  })

  it('falls back to levelColors, then the default', () => {
    expect(resolveHeatmapLevelStyles(COLORS)[2].color).toBe('c2')
    expect(resolveHeatmapLevelStyles()).toBe(HEATMAP_DEFAULT_LEVEL_STYLES)
  })
})

describe('buildHeatmapFillScale', () => {
  it('returns a pattern url for patterned levels and a color otherwise', () => {
    const fill = buildHeatmapFillScale(PATTERNED)
    expect(fill(2)).toBe('c2')
    expect(fill(9)).toBe(`url(#${heatmapLevelPatternId(4)})`)
  })

  it('treats null as empty', () => {
    expect(buildHeatmapFillScale(PATTERNED)(null)).toBe('c0')
  })
})

describe('heatmapLevelCellFillOpacity', () => {
  it('is 1 for solid levels and the pattern opacity otherwise', () => {
    expect(heatmapLevelCellFillOpacity(PATTERNED[0])).toBe(1)
    expect(heatmapLevelCellFillOpacity(PATTERNED[4])).toBe(0.5)
  })
})

describe('heatmapLevelPatternRenderOptions', () => {
  it('scales cross wider than the other presets', () => {
    expect(heatmapLevelPatternRenderOptions({ color: 'c', pattern: 'cross' }).scale).toBe(1.33)
    expect(heatmapLevelPatternRenderOptions({ color: 'c', pattern: 'dots' }).scale).toBe(1)
  })

  it('uses the accent color for the accent preset', () => {
    expect(heatmapLevelPatternRenderOptions({ color: 'c', pattern: 'accent' }).color).toBe(
      '#e879f9'
    )
  })

  it('derives a lightened stroke from the level color otherwise', () => {
    expect(heatmapLevelPatternRenderOptions({ color: 'red', pattern: 'dots' }).color).toBe(
      'color-mix(in oklch, red 45%, white)'
    )
  })

  it('falls back to the level color as the tile background', () => {
    expect(heatmapLevelPatternRenderOptions({ color: 'red', pattern: 'dots' }).tileBackground).toBe(
      'red'
    )
  })
})

describe('levelColorsFromStyles / levelStylesFromColors', () => {
  it('round-trips', () => {
    expect(levelColorsFromStyles(levelStylesFromColors(COLORS))).toEqual(COLORS)
  })
})
