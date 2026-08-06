import type { ComputedRef, Ref } from 'vue'

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

/** One row of chart data: an x value plus numeric series values. */
export type ChartDatum = Record<string, unknown>

export type XValue = Date | string

export interface HoverState {
  active: boolean
  index: number
  x: number
}

export interface LineConfig {
  dataKey: string
  color: string
  /** Renderer that registered this series; decides whether it drives the y-domain. */
  kind?: 'line' | 'area' | 'bar'
  /** Y-scale group; pairs with a matching YAxis. Default: "left". */
  yAxisId?: string
  /** Overrides the tooltip dot x (bars center the dot on their own bar). */
  dotX?: (datum: ChartDatum) => number
  /** Overrides the tooltip dot y (e.g. stacked bars). */
  dotY?: (datum: ChartDatum) => number
}

/** Styling for series point markers (Line/Area `markers` prop). */
export interface SeriesPointMarkerStyle {
  /** Point radius in px. Default: 5 */
  radius?: number
  /** Inner fill. Default: var(--chart-background) */
  fill?: string
  /** Ring stroke color. Default: the series stroke. */
  stroke?: string
  /** Ring stroke width in px. Default: 2 */
  strokeWidth?: number
}

/** Callable scale — scaleTime or scaleBand; band scales expose bandwidth(). */
export interface XScale {
  (value: XValue): number
  bandwidth?: () => number
  invert?: (px: number) => Date
  domain?: () => XValue[]
}

export interface YScale {
  (value: number): number
  ticks: (count: number) => number[]
}

/** Default y-axis id when a series/axis omits `yAxisId`. */
export const DEFAULT_Y_AXIS_ID = 'left'

export interface ChartContextValue {
  data: ComputedRef<ChartDatum[]>
  /** Data eased toward `data` during a morph; equals `data` for bars. */
  renderData: Ref<ChartDatum[]> | ComputedRef<ChartDatum[]>
  margin: ComputedRef<Margin>
  xAccessor: (datum: ChartDatum) => XValue
  xScale: ComputedRef<XScale>
  /** Primary (`"left"`) y-scale — convenience for single-axis charts. */
  yScale: ComputedRef<YScale>
  /** All y-scales keyed by yAxisId; use `getYScale(id)` to resolve. */
  yScales: ComputedRef<Record<string, YScale>>
  getYScale: (yAxisId?: string) => YScale
  innerWidth: ComputedRef<number>
  innerHeight: ComputedRef<number>
  /** Enter/reveal duration in ms (drives stagger + clip reveal). */
  animationDurationMs: ComputedRef<number>
  status: ComputedRef<'loading' | 'ready'>
  /** Bar-chart-only stacking config (absent on line/area). */
  bar?: {
    stacked: boolean
    stackGap: number
    /** Cumulative value of series stacked below `dataKey` in this row. */
    stackBase: (datum: ChartDatum, dataKey: string) => number
  }
  hover: Readonly<HoverState>
  /** Series index the Legend is hovering (dims the others). Null when idle. */
  legend: Readonly<{ hoveredIndex: number | null }>
  setLegendHover: (index: number | null) => void
  /** Series dataKeys hidden via the Legend (click to toggle). */
  hiddenKeys: Readonly<Set<string>>
  isSeriesHidden: (dataKey: string) => boolean
  toggleSeries: (dataKey: string) => void
  containerRef: Ref<HTMLDivElement | null>
  containerWidth: Ref<number>
  series: readonly LineConfig[]
  registerSeries: (entry: LineConfig) => void
  /** Series components clip themselves to this — grid/axis stay unclipped. */
  revealClipId?: string
}

export { DEFAULT_CHART_ENTER_TRANSITION } from './utils/animation'
