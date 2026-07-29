import type { XValue } from '../context'

export type ReferenceAreaIfOverflow = 'hidden' | 'visible' | 'discard'

export interface ReferenceAreaRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ComputeReferenceAreaRectOptions {
  innerWidth: number
  innerHeight: number
  x1?: XValue
  x2?: XValue
  y1?: number
  y2?: number
  ifOverflow?: ReferenceAreaIfOverflow
  xScale: (value: XValue) => number
  yScale: (value: number) => number
}

function resolveXPixel(
  xScale: (value: XValue) => number,
  value: XValue | undefined,
  fallback: number
): number {
  return value == null ? fallback : xScale(value)
}

function resolveYPixel(
  yScale: (value: number) => number,
  value: number | undefined,
  fallback: number
): number {
  return value == null ? fallback : yScale(value)
}

function clampRectToPlot(
  rect: ReferenceAreaRect,
  innerWidth: number,
  innerHeight: number
): ReferenceAreaRect | null {
  const x1 = Math.max(0, rect.x)
  const y1 = Math.max(0, rect.y)
  const x2 = Math.min(innerWidth, rect.x + rect.width)
  const y2 = Math.min(innerHeight, rect.y + rect.height)
  const width = x2 - x1
  const height = y2 - y1
  if (width <= 0 || height <= 0) {
    return null
  }
  return { x: x1, y: y1, width, height }
}

function isFullyInsidePlot(
  rect: ReferenceAreaRect,
  innerWidth: number,
  innerHeight: number
): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= innerWidth &&
    rect.y + rect.height <= innerHeight
  )
}

/** Map reference-area data bounds to a plot-pixel rect. Null when empty. */
export function computeReferenceAreaRect(
  options: ComputeReferenceAreaRectOptions
): ReferenceAreaRect | null {
  const { innerWidth, innerHeight, x1, x2, y1, y2, ifOverflow = 'hidden', xScale, yScale } = options

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null
  }

  const left = resolveXPixel(xScale, x1, 0)
  const right = resolveXPixel(xScale, x2, innerWidth)
  const top = resolveYPixel(yScale, y1, 0)
  const bottom = resolveYPixel(yScale, y2, innerHeight)

  const width = Math.abs(right - left)
  const height = Math.abs(bottom - top)
  if (width <= 0 || height <= 0) {
    return null
  }

  const rect: ReferenceAreaRect = {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    width,
    height
  }

  if (ifOverflow === 'visible') {
    return rect
  }
  if (ifOverflow === 'discard') {
    return isFullyInsidePlot(rect, innerWidth, innerHeight) ? rect : null
  }
  return clampRectToPlot(rect, innerWidth, innerHeight)
}
