import { animate } from 'motion-v'
import { onScopeDispose, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DEFAULT_ANIMATION_EASING } from '../utils/animation'
import { lerpYDomain, shouldTweenYDomain, yDomainsEqual } from '../utils/y-domain'
import type { YDomain } from '../utils/y-domain'

export interface AnimatedYDomainsOptions {
  target: MaybeRefOrGetter<Record<string, YDomain>>
  enabled: MaybeRefOrGetter<boolean>
  durationMs: MaybeRefOrGetter<number>
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Tween y-domains toward their target so grid lines glide instead of jumping. */
export function useAnimatedYDomains(
  options: AnimatedYDomainsOptions
): Ref<Record<string, YDomain>> {
  const animated = shallowRef<Record<string, YDomain>>(toValue(options.target))
  let tween: { stop: () => void } | undefined
  /** Series register after setup, so the first target is the mount value — snap it. */
  let settledOnce = false

  function snap(destination: Record<string, YDomain>): void {
    if (!yDomainsEqual(animated.value, destination)) {
      animated.value = destination
    }
  }

  watch(
    () => toValue(options.target),
    (destination) => {
      tween?.stop()
      const from = animated.value
      if (yDomainsEqual(from, destination)) {
        return
      }

      const axes = Object.keys(destination)
      const worthTweening = axes.some((axis) =>
        shouldTweenYDomain(from[axis] ?? destination[axis], destination[axis])
      )
      if (!settledOnce || !toValue(options.enabled) || prefersReducedMotion() || !worthTweening) {
        settledOnce = true
        snap(destination)
        return
      }

      const fromByAxis: Record<string, YDomain> = {}
      for (const axis of axes) {
        fromByAxis[axis] = from[axis] ?? destination[axis]
      }

      tween = animate(0, 1, {
        duration: toValue(options.durationMs) / 1000,
        ease: [...DEFAULT_ANIMATION_EASING],
        onUpdate(progress: number) {
          const next: Record<string, YDomain> = {}
          for (const axis of axes) {
            const start = fromByAxis[axis]
            const end = destination[axis]
            next[axis] = shouldTweenYDomain(start, end) ? lerpYDomain(start, end, progress) : end
          }
          animated.value = next
        },
        onComplete() {
          snap(destination)
        }
      })
    }
  )

  onScopeDispose(() => tween?.stop())

  return animated
}
