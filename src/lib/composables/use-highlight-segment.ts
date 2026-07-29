import { shallowRef, watch } from 'vue'
import type { ChartContextValue } from '../context'
import { computeSegmentBounds } from '../utils/highlight-segment-bounds'

// Hover-highlight band shared by ChartLine and ChartArea — the pixel range
// one data point either side of the hovered point.

export const HIGHLIGHT_SPRING = {
  type: 'spring',
  stiffness: 180,
  damping: 28
} as const

type HighlightContext = Pick<ChartContextValue, 'data' | 'xScale' | 'xAccessor' | 'hover'>

export function useHighlightSegment({ data, xScale, xAccessor, hover }: HighlightContext) {
  const segmentBounds = shallowRef({ x: 0, width: 0 })
  const hoverEpoch = shallowRef(0)

  watch(
    () => [hover.active, hover.index],
    () => {
      if (hover.active && data.value.length > 0) {
        segmentBounds.value = computeSegmentBounds(data.value, xScale.value, xAccessor, hover.index)
      }
    }
  )

  watch(
    () => hover.active,
    (isHovering) => {
      if (isHovering) {
        hoverEpoch.value += 1
      }
    }
  )

  return { segmentBounds, hoverEpoch }
}
