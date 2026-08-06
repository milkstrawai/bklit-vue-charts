<script setup lang="ts">
import { bisector, extent, max, min } from 'd3-array'
import { scaleTime } from 'd3-scale'
import { animate, motion } from 'motion-v'
import { computed, shallowRef, useId, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { DEFAULT_CHART_ENTER_TRANSITION, DEFAULT_Y_AXIS_ID } from '../context'
import type { ChartDatum, XScale, YScale } from '../context'
import { chartShellProps, useChartShell } from '../composables/use-chart-shell'

const props = defineProps({
  ...chartShellProps('date'),
  /** Visible x-range for brush zoom; defaults to the full data extent. */
  xDomain: { type: Array as unknown as () => [Date, Date], default: undefined }
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
  makeYScales,
  provideContext
} = useChartShell(props)

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

const yScales = makeYScales((keys) => {
  const lo = min(props.data, (d) => min(keys, (k) => d[k] as number))
  const hi = max(props.data, (d) => max(keys, (k) => d[k] as number))
  if (lo === undefined || hi === undefined) {
    return [0, 100]
  }
  if (lo >= 0) {
    return [0, hi <= 0 ? 100 : hi * 1.1]
  }
  const pad = (hi - lo) * 0.05 || 1
  return [lo - pad, hi + pad]
})
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
