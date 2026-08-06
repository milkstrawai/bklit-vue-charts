<script setup lang="ts">
import { bisector, extent, max, min } from 'd3-array'
import { scaleTime } from 'd3-scale'
import { animate, motion } from 'motion-v'
import { computed, shallowRef, useId, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { DEFAULT_CHART_ENTER_TRANSITION, DEFAULT_Y_AXIS_ID } from '../context'
import type { ChartDatum, XScale, YScale } from '../context'
import { useChartShell } from '../composables/use-chart-shell'
import { useAnimatedYDomains } from '../composables/use-animated-y-domains'
import { niceYDomain, resolveTimeSeriesYDomain } from '../utils/y-domain'
import type { YDomain } from '../utils/y-domain'
import { timeSeriesChartProps } from './time-series-chart-props'

const props = defineProps({
  ...timeSeriesChartProps(),
  /** `"line"` keeps areas and bars out of the y-domain; `"area"` counts every series. */
  domainSeriesKind: {
    type: String as unknown as () => 'line' | 'area',
    default: 'line' as const
  }
})

const {
  containerRef,
  width,
  height,
  innerWidth,
  innerHeight,
  commitHover,
  clearHover,
  xAccessor,
  plotX,
  resolvedYKeys,
  keysByAxis,
  makeYScalesFromDomains,
  provideContext
} = useChartShell(props, {
  domainSeriesFilter: (entry) =>
    props.domainSeriesKind === 'area' || (entry.kind !== 'area' && entry.kind !== 'bar')
})

const dateAccessor = (datum: ChartDatum): Date => xAccessor(datum) as Date

const renderData = shallowRef(props.data)
let dataTween: { stop: () => void } | undefined
watch(
  () => props.data,
  (next, prev) => {
    dataTween?.stop()
    if (!prev || prev.length !== next.length) {
      renderData.value = next
      return
    }
    const from = renderData.value
    const keys = resolvedYKeys.value
    dataTween = animate(0, 1, {
      duration: 0.55,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(t: number) {
        renderData.value = next.map((datum, i) => {
          const out: ChartDatum = { ...datum }
          for (const key of keys) {
            const fromValue = from[i][key] as number
            const toValue = datum[key] as number
            out[key] = fromValue + (toValue - fromValue) * t
          }
          return out
        })
      }
    })
  }
)

const xScale = computed(() => {
  if (props.xDomain) {
    return scaleTime().domain(props.xDomain).range([0, innerWidth.value])
  }
  const [start, end] = extent(props.data, dateAccessor)
  return scaleTime()
    .domain(start === undefined ? [new Date(0), new Date(1)] : [start, end as Date])
    .range([0, innerWidth.value])
})

const yDomainData = computed(() => {
  if (!props.xDomain) {
    return props.data
  }
  const [from, to] = props.xDomain
  const start = Math.min(from.getTime(), to.getTime())
  const end = Math.max(from.getTime(), to.getTime())
  return props.data.filter((d) => {
    const time = dateAccessor(d).getTime()
    return time >= start && time <= end
  })
})

const numeric = (datum: ChartDatum, key: string): number | undefined =>
  typeof datum[key] === 'number' ? (datum[key] as number) : undefined

const yDomainTarget = computed<Record<string, YDomain>>(() => {
  const domains: Record<string, YDomain> = {}
  for (const [axis, keys] of Object.entries(keysByAxis.value)) {
    const lo = min(yDomainData.value, (d) => min(keys, (k) => numeric(d, k)))
    const hi = max(yDomainData.value, (d) => max(keys, (k) => numeric(d, k)))
    domains[axis] = niceYDomain(resolveTimeSeriesYDomain(lo, hi))
  }
  return domains
})

const animatedYDomains = useAnimatedYDomains({
  target: yDomainTarget,
  enabled: () => props.yDomainTween || (props.tweenYDomainOnXDomainChange && props.xDomain != null),
  durationMs: () => props.yDomainTweenDuration
})

const yScales = makeYScalesFromDomains(animatedYDomains)
const getYScale = (yAxisId: string = DEFAULT_Y_AXIS_ID): YScale =>
  yScales.value[yAxisId] ?? yScales.value[DEFAULT_Y_AXIS_ID]
const yScale = computed(() => getYScale())

const bisectDate = bisector(dateAccessor).center

function onPointerMove(event: PointerEvent): void {
  const px = plotX(event)
  if (px === null) {
    clearHover()
    return
  }
  const index = bisectDate(props.data, xScale.value.invert(px))
  commitHover(index, xScale.value(dateAccessor(props.data[index])))
}

const revealClipId = `chart-reveal-${useId()}`

provideContext({
  renderData,
  xScale: xScale as unknown as ComputedRef<XScale>,
  yScale,
  yScales,
  getYScale,
  revealClipId
})
</script>

<template>
  <div class="bklit-chart-wrap">
    <div ref="containerRef" class="bklit-chart" :style="{ aspectRatio }">
      <svg
        v-if="innerWidth > 0 && data.length > 0"
        :width="width"
        :height="height"
        @pointermove="onPointerMove"
        @pointerleave="clearHover"
      >
        <defs>
          <clipPath :id="revealClipId">
            <motion.rect
              :height="innerHeight + 20"
              :y="0"
              :initial="{ width: 0 }"
              :animate="{ width: innerWidth }"
              :transition="DEFAULT_CHART_ENTER_TRANSITION"
            />
          </clipPath>
        </defs>
        <g :transform="`translate(${margin.left},${margin.top})`">
          <slot />
        </g>
      </svg>
      <div v-if="status === 'loading' && loadingLabel" class="chart-loading-label">
        {{ loadingLabel }}
      </div>
      <div v-if="data.length === 0 && status !== 'loading'" class="chart-empty">
        {{ emptyLabel }}
      </div>
    </div>
    <slot name="overlay" />
  </div>
</template>
