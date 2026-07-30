// Chart roots
export { default as LineChart } from './components/time-series-chart-shell.vue'
export { default as AreaChart } from './components/time-series-chart-shell.vue'
export { default as BarChart } from './components/bar-chart.vue'

// Series + chrome
export { default as Line } from './components/line.vue'
export { default as Area } from './components/area.vue'
export { default as Bar } from './components/bar.vue'
export { default as Grid } from './components/grid.vue'
export { default as Background } from './components/background.vue'
export { default as XAxis } from './components/x-axis.vue'
export { default as BarXAxis } from './components/bar-x-axis.vue'
export { default as YAxis } from './components/y-axis.vue'
export { default as ChartTooltip } from './components/chart-tooltip.vue'
export { default as Legend } from './components/legend.vue'
export { default as ChartBrush } from './components/chart-brush.vue'
export { default as ReferenceArea } from './components/reference-area.vue'

// Standalone charts
export { default as FunnelChart } from './components/funnel-chart.vue'
export { default as HeatmapChart } from './components/heatmap-chart.vue'

export { useChart } from './composables/use-chart'

// Types + utilities
export type {
  ChartContextValue,
  ChartDatum,
  LineConfig,
  Margin,
  SeriesPointMarkerStyle,
  XValue
} from './context'
export { DEFAULT_CHART_ENTER_TRANSITION, DEFAULT_Y_AXIS_ID } from './context'
export type { TooltipRow } from './components/chart-tooltip.vue'
export type { ChartBrushSelection } from './components/chart-brush.vue'
export type { FunnelGradientStop, FunnelStage } from './components/funnel-chart.vue'
export type { HeatmapBin, HeatmapColumn } from './utils/heatmap-utils'
