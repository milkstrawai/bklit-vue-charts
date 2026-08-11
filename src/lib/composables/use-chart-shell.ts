import { useElementSize } from '@vueuse/core'
import { scaleLinear } from 'd3-scale'
import { computed, reactive, readonly, ref } from 'vue'
import type { ComputedRef, PropType, Ref } from 'vue'
import { DEFAULT_Y_AXIS_ID } from '../context'
import { DEFAULT_ANIMATION_DURATION_MS } from '../utils/animation'
import type { ChartContextValue, ChartDatum, Margin, LineConfig, XValue, YScale } from '../context'
import { useProvideChart } from './use-chart'

export interface ChartShellProps {
  data: ChartDatum[]
  margin: Margin
  aspectRatio: string
  xDataKey: string
  animationDuration: number
  status: 'loading' | 'ready'
  loadingLabel: string
  emptyLabel: string
}

/** Shared shell props. */
export function chartShellProps(xKeyDefault: string) {
  return {
    data: { type: Array as PropType<ChartDatum[]>, required: true as const },
    margin: {
      type: Object as PropType<Margin>,
      default: (): Margin => ({ top: 40, right: 40, bottom: 40, left: 40 })
    },
    aspectRatio: { type: String, default: '2 / 1' },
    xDataKey: { type: String, default: xKeyDefault },
    animationDuration: { type: Number, default: DEFAULT_ANIMATION_DURATION_MS },
    status: {
      type: String as PropType<'loading' | 'ready'>,
      default: 'ready' as const
    },
    loadingLabel: { type: String, default: '' },
    emptyLabel: { type: String, default: 'No data' }
  }
}

/** Domain (min,max) for one axis's keys — differs per chart type. */
export type AxisDomain = (keys: string[]) => [number, number]

type ProvidedScales = Pick<
  ChartContextValue,
  'renderData' | 'xScale' | 'yScale' | 'yScales' | 'getYScale'
> & { revealClipId?: string; bar?: ChartContextValue['bar'] }

export interface ChartShellOptions {
  /** Restricts which series drive the y-domain. Default: all of them. */
  domainSeriesFilter?: (entry: LineConfig) => boolean
}

/**
 * Shared chart-shell logic: container sizing, hover state, series registry,
 * per-axis y-scales, and the provided context. Each shell supplies its own
 * x-scale, pointer snapping, and y-domain rule.
 */
export function useChartShell(props: ChartShellProps, options: ChartShellOptions = {}) {
  const containerRef = ref<HTMLDivElement | null>(null)
  const { width, height } = useElementSize(containerRef)

  const innerWidth = computed(() =>
    Math.max(0, width.value - props.margin.left - props.margin.right)
  )
  const innerHeight = computed(() =>
    Math.max(0, height.value - props.margin.top - props.margin.bottom)
  )

  const hover = reactive({ active: false, index: -1, x: 0 })

  let hoverRaf: number | null = null
  let pendingHover: { index: number; x: number } | null = null
  function commitHover(index: number, x: number): void {
    pendingHover = { index, x }
    if (hoverRaf !== null) {
      return
    }
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = null
      if (!pendingHover) {
        return
      }
      hover.active = true
      hover.index = pendingHover.index
      hover.x = pendingHover.x
    })
  }
  function clearHover(): void {
    if (hoverRaf !== null) {
      cancelAnimationFrame(hoverRaf)
      hoverRaf = null
    }
    pendingHover = null
    hover.active = false
  }

  const series = reactive<LineConfig[]>([])
  function registerSeries(entry: LineConfig): void {
    if (!series.some((s) => s.dataKey === entry.dataKey)) {
      series.push(entry)
    }
  }

  const hidden = reactive(new Set<string>())
  function isSeriesHidden(dataKey: string): boolean {
    return hidden.has(dataKey)
  }
  function toggleSeries(dataKey: string): void {
    if (hidden.has(dataKey)) {
      hidden.delete(dataKey)
    } else {
      hidden.add(dataKey)
    }
  }

  const xAccessor = (datum: ChartDatum): XValue => datum[props.xDataKey] as XValue

  const resolvedYKeys = computed(() => series.map((s) => s.dataKey))

  const domainSeries = computed(() =>
    options.domainSeriesFilter ? series.filter(options.domainSeriesFilter) : [...series]
  )

  const keysByAxis = computed<Record<string, string[]>>(() => {
    if (domainSeries.value.length === 0) {
      return { [DEFAULT_Y_AXIS_ID]: [] }
    }
    const groups: Record<string, string[]> = {}
    for (const s of domainSeries.value) {
      const axis = s.yAxisId ?? DEFAULT_Y_AXIS_ID
      ;(groups[axis] ??= []).push(s.dataKey)
    }
    for (const axis of Object.keys(groups)) {
      const visible = groups[axis].filter((k) => !hidden.has(k))
      groups[axis] = visible.length > 0 ? visible : groups[axis]
    }
    return groups
  })

  /** Build one linear y-scale per axis from that axis's keys. */
  function makeYScales(domainFor: AxisDomain): ComputedRef<Record<string, YScale>> {
    return computed(() => {
      const scales: Record<string, YScale> = {}
      for (const [axis, keys] of Object.entries(keysByAxis.value)) {
        scales[axis] = scaleLinear()
          .domain(domainFor(keys))
          .range([innerHeight.value, 0])
          .nice() as unknown as YScale
      }
      return scales
    })
  }

  /** Build y-scales from externally owned domains (already `nice()`d, possibly mid-tween). */
  function makeYScalesFromDomains(
    domains: Ref<Record<string, [number, number]>>
  ): ComputedRef<Record<string, YScale>> {
    return computed(() => {
      const scales: Record<string, YScale> = {}
      for (const axis of Object.keys(keysByAxis.value)) {
        const domain = domains.value[axis] ?? domains.value[DEFAULT_Y_AXIS_ID] ?? [0, 100]
        scales[axis] = scaleLinear()
          .domain(domain)
          .range([innerHeight.value, 0]) as unknown as YScale
      }
      return scales
    })
  }

  /** Plot-relative pointer x, or null when outside the plot area. */
  function plotX(event: PointerEvent): number | null {
    if (!containerRef.value) {
      return null
    }
    const rect = containerRef.value.getBoundingClientRect()
    const px = event.clientX - rect.left - props.margin.left
    if (px < 0 || px > innerWidth.value || props.data.length === 0) {
      return null
    }
    return px
  }

  function provideContext(scales: ProvidedScales): void {
    useProvideChart({
      data: computed(() => props.data),
      margin: computed(() => props.margin),
      xAccessor,
      hover: readonly(hover),
      hiddenKeys: hidden as Readonly<Set<string>>,
      isSeriesHidden,
      toggleSeries,
      containerRef,
      containerWidth: width,
      innerWidth,
      innerHeight,
      animationDurationMs: computed(() => props.animationDuration),
      status: computed(() => props.status),
      series: readonly(series) as readonly LineConfig[],
      registerSeries,
      ...scales
    })
  }

  return {
    containerRef,
    width,
    height,
    innerWidth,
    innerHeight,
    hover,
    commitHover,
    clearHover,
    xAccessor,
    plotX,
    series,
    resolvedYKeys,
    keysByAxis,
    makeYScales,
    makeYScalesFromDomains,
    provideContext
  }
}
