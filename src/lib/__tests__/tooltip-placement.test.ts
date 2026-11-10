import { describe, expect, it } from 'vitest'
import { placeTooltipX } from '../utils/tooltip-placement'
import type { TooltipXPlacementInput } from '../utils/tooltip-placement'

// 550px container, 290px panel, 16px offset, 8px padding: the right side fits up
// to anchor 236 (236 + 16 + 290 = 542) and the left side from anchor 314
// (314 - 16 - 290 = 8), so anchors in between fit on neither side.
const base = { containerWidth: 550, width: 290, offset: 16, padding: 8 }
const place = (anchor: number, overrides: Partial<TooltipXPlacementInput> = {}) =>
  placeTooltipX({ ...base, anchor, ...overrides })

describe('placeTooltipX', () => {
  it('sits right of the crosshair when the right side fits', () => {
    expect(place(100)).toEqual({ x: 116, flipped: false })
  })

  it('stays right until the panel reaches the right padding', () => {
    expect(place(236)).toEqual({ x: 252, flipped: false })
  })

  it('flips left when only the left side fits', () => {
    expect(place(400)).toEqual({ x: 94, flipped: true })
  })

  it('flips left as soon as the left side fits', () => {
    expect(place(314)).toEqual({ x: 8, flipped: true })
  })

  describe('when neither side fits', () => {
    it('stays right when the right has more room, pulled back to the right padding', () => {
      expect(place(260)).toEqual({ x: 252, flipped: false })
    })

    it('flips left when the left has more room, pulled back to the left padding', () => {
      expect(place(290)).toEqual({ x: 8, flipped: true })
    })

    it('breaks a tie toward the right', () => {
      expect(place(275)).toEqual({ x: 252, flipped: false })
    })

    it('keeps the bug-report case inside the chart', () => {
      // Sep 24 in a 550px chart with a 291.5px panel: the old rule put x at -29.9.
      expect(place(277.6, { width: 291.5 })).toEqual({ x: 8, flipped: true })
    })
  })

  it('pins a panel wider than the container to the left padding', () => {
    for (const anchor of [0, 150, 300]) {
      expect(place(anchor, { containerWidth: 300, width: 320 }).x).toBe(8)
    }
  })

  it('never leaves the container, and keeps the offset whenever a side fits', () => {
    for (const containerWidth of [320, 550, 900]) {
      for (const width of [140, 180, 290, containerWidth - 16]) {
        for (let anchor = 0; anchor <= containerWidth; anchor += 0.5) {
          const { x, flipped } = place(anchor, { containerWidth, width })
          expect(x).toBeGreaterThanOrEqual(8)
          expect(x + width).toBeLessThanOrEqual(containerWidth - 8)

          if (anchor + 16 + width <= containerWidth - 8) {
            expect({ x, flipped }).toEqual({ x: anchor + 16, flipped: false })
          } else if (anchor - 16 - width >= 8) {
            expect({ x, flipped }).toEqual({ x: anchor - 16 - width, flipped: true })
          } else {
            expect(flipped).toBe(anchor > containerWidth / 2)
          }
        }
      }
    }
  })
})
