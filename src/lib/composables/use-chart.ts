import { createInjectionState } from '@vueuse/core'
import type { ChartContextValue } from '../context'

const [useProvideChart, useInjectedChart] = createInjectionState(
  (context: ChartContextValue) => context
)

export { useProvideChart }

/**
 * Access the context provided by a `LineChart`, `AreaChart`, or `BarChart`.
 * Throws a clear error when a series/chrome component is rendered outside one.
 */
export function useChart(): ChartContextValue {
  const context = useInjectedChart()
  if (!context) {
    throw new Error('useChart() must be called inside a <LineChart>, <AreaChart>, or <BarChart>.')
  }
  return context
}
