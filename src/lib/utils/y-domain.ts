import { scaleLinear } from 'd3-scale'

export type YDomain = [number, number]

export const DEFAULT_Y_DOMAIN_TWEEN_MS = 500

export const Y_DOMAIN_TWEEN_SKIP_THRESHOLD = 0.02

export function niceYDomain(domain: YDomain): YDomain {
  const [lo, hi] = scaleLinear().domain(domain).nice().domain()
  return [lo ?? domain[0], hi ?? domain[1]]
}

/** Zero-based while values are non-negative; floating with 5% padding otherwise. */
export function resolveTimeSeriesYDomain(
  min: number | undefined,
  max: number | undefined
): YDomain {
  if (min === undefined || max === undefined) {
    return [0, 100]
  }
  if (min >= 0) {
    return [0, max <= 0 ? 100 : max * 1.1]
  }
  const padding = (max - min) * 0.05 || 1
  return [min - padding, max + padding]
}

export function shouldTweenYDomain(from: YDomain, to: YDomain): boolean {
  const span = Math.max(Math.abs(to[1] - to[0]), Math.abs(from[1] - from[0]), 1)
  return (
    Math.abs(to[0] - from[0]) / span >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD ||
    Math.abs(to[1] - from[1]) / span >= Y_DOMAIN_TWEEN_SKIP_THRESHOLD
  )
}

export function lerpYDomain(from: YDomain, to: YDomain, progress: number): YDomain {
  return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress]
}

export function yDomainsEqual(
  left: Record<string, YDomain>,
  right: Record<string, YDomain>
): boolean {
  const keys = Object.keys(left)
  if (keys.length !== Object.keys(right).length) {
    return false
  }
  return keys.every((axis) => {
    const from = left[axis]
    const to = right[axis]
    return Boolean(from && to) && from[0] === to[0] && from[1] === to[1]
  })
}
