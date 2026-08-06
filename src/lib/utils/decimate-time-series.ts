import type { ChartDatum } from '../context'

/**
 * Largest-Triangle-Three-Buckets downsampling for time-series SVG paths.
 * Keeps first/last points and picks visually significant points per bucket.
 */
export function decimateTimeSeries<T extends ChartDatum>(
  data: T[],
  maxPoints: number,
  valueKeys: string[] = []
): T[] {
  const len = data.length
  if (maxPoints >= len || maxPoints < 3) {
    return data
  }

  const getY = (point: T, index: number): number => {
    if (valueKeys.length === 0) {
      for (const value of Object.values(point)) {
        if (typeof value === 'number') {
          return value
        }
      }
      return index
    }

    let sum = 0
    let count = 0
    for (const key of valueKeys) {
      const value = point[key]
      if (typeof value === 'number') {
        sum += value
        count++
      }
    }
    return count > 0 ? sum / count : index
  }

  const sampled: T[] = [data[0]]
  const bucketSize = (len - 2) / (maxPoints - 2)
  let previousIndex = 0

  for (let i = 0; i < maxPoints - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1
    const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len - 1)

    const nextRangeStart = Math.floor((i + 2) * bucketSize) + 1
    const nextRangeEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, len)
    const nextCount = Math.max(0, nextRangeEnd - nextRangeStart)

    let avgX = len - 1
    let avgY = getY(data[len - 1], len - 1)
    if (nextCount > 0) {
      avgX = 0
      avgY = 0
      for (let j = nextRangeStart; j < nextRangeEnd; j++) {
        avgX += j
        avgY += getY(data[j], j)
      }
      avgX /= nextCount
      avgY /= nextCount
    }

    const ax = previousIndex
    const ay = getY(data[previousIndex], previousIndex)

    let maxArea = -1
    let maxIndex = rangeStart

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs((ax - avgX) * (getY(data[j], j) - ay) - (ax - j) * (avgY - ay)) * 0.5
      if (area > maxArea) {
        maxArea = area
        maxIndex = j
      }
    }

    sampled.push(data[maxIndex])
    previousIndex = maxIndex
  }

  sampled.push(data[len - 1])
  return sampled
}

/** ~1.5 points per pixel — enough for crisp curves without over-drawing. */
export function maxRenderPointsForWidth(innerWidth: number): number {
  return Math.max(64, Math.ceil(innerWidth * 1.5))
}
