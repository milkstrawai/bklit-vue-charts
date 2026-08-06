<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, onMounted, shallowRef } from 'vue'
import { useChart } from '../composables/use-chart'
import type { ChartDatum } from '../context'
import { DEFAULT_ANIMATION_DURATION_MS, DEFAULT_ANIMATION_EASING } from '../utils/animation'

interface BarProps {
  dataKey: string
  /** Y-scale group for biaxial charts (pair with a matching YAxis). */
  yAxisId?: string
  fill?: string
  /** Bar end caps: "round", "butt", or a custom radius in px. Default: "round" */
  lineCap?: 'round' | 'butt' | number
  /** Enable the entrance animation. Default: true */
  animate?: boolean
  /** "grow" (height) or "fade" (opacity + blur). Default: "grow" */
  animationType?: 'grow' | 'fade'
  /** Override the auto-calculated per-bar stagger (seconds). */
  staggerDelay?: number
  /** Floor short/zero bars to this px height so they stay visible. Default: 0 */
  minBarHeight?: number
  /** Opacity of non-hovered bars while one is hovered */
  fadedOpacity?: number
  /** Gap between grouped series bars in px */
  groupGap?: number
  /** Print each bar's value above it. Default: false */
}

const props = withDefaults(defineProps<BarProps>(), {
  fill: 'var(--chart-line-primary)',
  lineCap: 'round',
  animate: true,
  animationType: 'grow',
  staggerDelay: undefined,
  minBarHeight: 0,
  fadedOpacity: 0.3,
  groupGap: 4
})

const {
  data,
  xScale,
  getYScale,
  innerHeight,
  xAccessor,
  hover,
  legend,
  series,
  registerSeries,
  isSeriesHidden,
  bar: barConfig
} = useChart()

const hidden = computed(() => isSeriesHidden(props.dataKey))

const yScale = computed(() => getYScale(props.yAxisId))
const stacked = computed(() => barConfig?.stacked ?? false)
const stackGap = computed(() => barConfig?.stackGap ?? 0)

const seriesIndex = computed(() => {
  const idx = series.findIndex((s) => s.dataKey === props.dataKey)
  return idx >= 0 ? idx : 0
})
const seriesCount = computed(() => Math.max(1, series.length))

const barWidth = computed(() => {
  const band = xScale.value.bandwidth?.() ?? 0
  if (stacked.value) {
    return band
  }
  const gap = seriesCount.value > 1 ? props.groupGap : 0
  return (band - gap * (seriesCount.value - 1)) / seriesCount.value
})
const cornerRadius = computed(() => {
  if (typeof props.lineCap === 'number') {
    return props.lineCap
  }
  return props.lineCap === 'round' ? Math.min(barWidth.value / 2, 8) : 0
})

function barX(datum: ChartDatum): number {
  const bandPos = xScale.value(xAccessor(datum))
  if (stacked.value) {
    return bandPos
  }
  const gap = seriesCount.value > 1 ? props.groupGap : 0
  return bandPos + seriesIndex.value * (barWidth.value + gap)
}

registerSeries({
  kind: 'bar',
  dataKey: props.dataKey,
  color: props.fill,
  yAxisId: props.yAxisId,
  dotX: (datum: ChartDatum) => barX(datum) + barWidth.value / 2,
  dotY: (datum: ChartDatum) => {
    const base = stacked.value ? (barConfig?.stackBase(datum, props.dataKey) ?? 0) : 0
    return yScale.value(base + (datum[props.dataKey] as number))
  }
})

const bars = computed(() =>
  data.value.map((datum, i) => {
    const value = datum[props.dataKey] as number
    const base = stacked.value ? (barConfig?.stackBase(datum, props.dataKey) ?? 0) : 0
    const top = yScale.value(base + value)
    const bottom = yScale.value(base)
    let height = Math.max(props.minBarHeight, bottom - top)
    if (stacked.value && seriesIndex.value > 0) {
      height = Math.max(0, height - stackGap.value)
    }
    return {
      key: `${xAccessor(datum)}-${i}`,
      x: barX(datum),
      y: bottom - height,
      height,
      value
    }
  })
)

const ENTER_DURATION_MS = DEFAULT_ANIMATION_DURATION_MS
const staggerDelay = computed(
  () =>
    props.staggerDelay ??
    (data.value.length > 1 ? (ENTER_DURATION_MS * 0.4) / 1000 / data.value.length : 0)
)

const hasEntered = shallowRef(false)
onMounted(() => {
  window.setTimeout(
    () => {
      hasEntered.value = true
    },
    ENTER_DURATION_MS + ENTER_DURATION_MS * 0.4
  )
})

function barTransition(index: number) {
  if (!props.animate || hasEntered.value) {
    return { duration: 0 } as const
  }
  return {
    type: 'tween',
    duration: ENTER_DURATION_MS / 1000,
    ease: DEFAULT_ANIMATION_EASING,
    delay: index * staggerDelay.value
  } as const
}

function barInitial(bar: { y: number; height: number }) {
  if (!props.animate) {
    return { height: bar.height, y: bar.y }
  }
  if (props.animationType === 'fade') {
    return { height: bar.height, y: bar.y, opacity: 0, filter: 'blur(2px)' }
  }
  return { height: 0, y: innerHeight.value }
}

function barOpacity(index: number): number {
  if (legend.hoveredIndex !== null && legend.hoveredIndex !== seriesIndex.value) {
    return props.fadedOpacity
  }
  return hover.active && hover.index !== index ? props.fadedOpacity : 1
}
</script>

<template>
  <g v-if="!hidden">
    <template v-for="(bar, i) in bars" :key="bar.key">
      <motion.rect
        v-if="animationType === 'fade'"
        :x="bar.x"
        :width="barWidth"
        :rx="cornerRadius"
        :fill="fill"
        :initial="barInitial(bar)"
        :animate="{
          height: bar.height,
          y: bar.y,
          opacity: barOpacity(i),
          filter: 'blur(0px)'
        }"
        :transition="barTransition(i)"
      />
      <g v-else :opacity="barOpacity(i)" style="transition: opacity 0.15s ease-in-out">
        <motion.rect
          :x="bar.x"
          :width="barWidth"
          :rx="cornerRadius"
          :fill="fill"
          :initial="barInitial(bar)"
          :animate="{ height: bar.height, y: bar.y }"
          :transition="barTransition(i)"
        />
      </g>
    </template>
  </g>
</template>

<style scoped></style>
