import type { ChartDatum, XValue } from '../context'

// The hover-highlight band: the pixel x-range one data point either side of
// the hovered point (clamped to the ends).

export interface SegmentBounds {
  x: number
  width: number
}

export function computeSegmentBounds(
  points: ChartDatum[],
  scale: (value: XValue) => number,
  xAccessor: (d: ChartDatum) => XValue,
  index: number
): SegmentBounds {
  if (points.length === 0) {
    return { x: 0, width: 0 }
  }
  const startX = scale(xAccessor(points[Math.max(0, index - 1)]))
  const endX = scale(xAccessor(points[Math.min(points.length - 1, index + 1)]))
  return { x: startX, width: endX - startX }
}
