import { chartShellProps } from '../composables/use-chart-shell'
import { DEFAULT_Y_DOMAIN_TWEEN_MS } from '../utils/y-domain'

/** Props shared by LineChart and AreaChart. */
export function timeSeriesChartProps() {
  return {
    ...chartShellProps('date'),
    /** Visible x-range for brush zoom; defaults to the full data extent. */
    xDomain: { type: Array as unknown as () => [Date, Date], default: undefined },
    /** Animate the y-domain when its target changes. Default: true */
    yDomainTween: { type: Boolean, default: true },
    /** Y-domain tween duration in milliseconds. Default: 500 */
    yDomainTweenDuration: { type: Number, default: DEFAULT_Y_DOMAIN_TWEEN_MS },
    /** Tween the y-domain when a brush changes the visible x-range. Default: false */
    tweenYDomainOnXDomainChange: { type: Boolean, default: false }
  }
}
