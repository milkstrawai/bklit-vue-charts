/** Default clip-reveal easing for cartesian charts. */
export const DEFAULT_ANIMATION_EASING = [0.85, 0, 0.15, 1] as const

export const DEFAULT_ANIMATION_DURATION_MS = 1100

/** Default enter transition for chart reveals. */
export const DEFAULT_CHART_ENTER_TRANSITION = {
  type: 'tween',
  duration: DEFAULT_ANIMATION_DURATION_MS / 1000,
  ease: DEFAULT_ANIMATION_EASING
} as const
