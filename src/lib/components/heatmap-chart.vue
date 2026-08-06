<script setup lang="ts">
import { useElementSize, useTimeoutFn } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  buildHeatmapColorScaleFromStyles,
  buildHeatmapFillScale,
  heatmapLevelCellFillOpacity,
  heatmapLevelPatternId,
  heatmapLevelPatternRenderOptions,
  isHeatmapLevelPattern,
  levelColorsFromStyles,
  resolveHeatmapLevelStyles
} from '../utils/heatmap-colors'
import type { HeatmapLevelColors, HeatmapLevelStyles } from '../utils/heatmap-colors'
import { formatHeatmapContributionLabel, getHeatmapContributionLevel } from '../utils/heatmap-utils'
import type { HeatmapBin, HeatmapColumn } from '../utils/heatmap-utils'
import PatternPreset from './pattern-preset.vue'

interface HeatmapChartProps {
  data: HeatmapColumn[]
  gap?: number
  cornerRadius?: number
  legendCornerRadius?: number
  colorScale?: (count: number | null | undefined) => string
  levelColors?: HeatmapLevelColors
  levelStyles?: HeatmapLevelStyles
  formatLabel?: (count: number, date: Date) => string
  /** Delay before showing the tooltip on first hover (ms). */
  showDelay?: number
  /** Grace period before hiding when the pointer leaves a cell (ms). */
  hideDelay?: number
  /** Appear and disappear instantly with no motion. */
  instant?: boolean
}

const props = withDefaults(defineProps<HeatmapChartProps>(), {
  gap: 2,
  cornerRadius: 2,
  legendCornerRadius: 2,
  colorScale: undefined,
  levelColors: undefined,
  levelStyles: undefined,
  formatLabel: formatHeatmapContributionLabel,
  showDelay: 0,
  hideDelay: 120,
  instant: false
})

const levelStyles = computed(() => resolveHeatmapLevelStyles(props.levelColors, props.levelStyles))

const resolvedColorScale = computed(
  () => props.colorScale ?? buildHeatmapColorScaleFromStyles(levelStyles.value)
)

const fillScale = computed(() =>
  props.colorScale ? props.colorScale : buildHeatmapFillScale(levelStyles.value)
)

const patternLevels = computed(() =>
  levelStyles.value
    .map((style, level) => ({ style, level }))
    .filter(({ style }) => isHeatmapLevelPattern(style))
    .map(({ style, level }) => ({
      level,
      id: heatmapLevelPatternId(level),
      pattern: style.pattern ?? 'diagonal',
      options: heatmapLevelPatternRenderOptions(style)
    }))
)

const legendColors = computed(() =>
  props.levelStyles || props.levelColors
    ? levelColorsFromStyles(levelStyles.value)
    : [0, 1, 2, 3, 4].map((level) => resolvedColorScale.value(level))
)

const MARGIN = { top: 28, right: 16, bottom: 0, left: 40 }
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short' })

const containerRef = ref<HTMLDivElement | null>(null)
const { width } = useElementSize(containerRef)

const columnCount = computed(() => props.data.length)
const cellSize = computed(() => {
  const innerWidth = width.value - MARGIN.left - MARGIN.right
  return Math.max(innerWidth / columnCount.value, 0)
})
const binSize = computed(() => Math.max(cellSize.value - props.gap, 0))
const gridHeight = computed(() => cellSize.value * 7 + MARGIN.top + MARGIN.bottom)

function cellX(column: number): number {
  return MARGIN.left + column * cellSize.value
}

function cellY(row: number): number {
  return MARGIN.top + row * cellSize.value
}

interface HeatmapCell {
  key: string
  bin: HeatmapBin
  column: number
  x: number
  y: number
  fill: string
  fillOpacity: number
}

const cells = computed<HeatmapCell[]>(() =>
  props.data.flatMap((column, columnIndex) =>
    column.bins
      .filter((bin) => bin.count >= 0)
      .map((bin) => {
        const level = getHeatmapContributionLevel(bin.count)
        return {
          key: `${column.bin}-${bin.bin}`,
          bin,
          column: columnIndex,
          x: cellX(columnIndex),
          y: cellY(bin.bin),
          fill: fillScale.value(bin.count),
          fillOpacity: heatmapLevelCellFillOpacity(levelStyles.value[level] ?? levelStyles.value[0])
        }
      })
  )
)

const monthTicks = computed(() => {
  const ticks: { key: string; x: number; label: string }[] = []
  let lastMonthKey = ''
  props.data.forEach((column, columnIndex) => {
    const anchor = column.bins.find((bin) => bin.date.getDate() === 1)
    if (!anchor) {
      return
    }
    const monthKey = `${anchor.date.getFullYear()}-${anchor.date.getMonth()}`
    if (monthKey === lastMonthKey) {
      return
    }
    ticks.push({
      key: monthKey,
      x: cellX(columnIndex),
      label: monthFmt.format(anchor.date)
    })
    lastMonthKey = monthKey
  })
  return ticks
})

const dayTicks = computed(() =>
  DAY_LABELS.map((label, row) => ({
    label,
    y: cellY(row) + binSize.value / 2
  })).filter((_, row) => row % 2 === 1)
)

interface HoveredCell {
  bin: HeatmapBin
  column: number
  row: number
  x: number
  y: number
}
const hovered = shallowRef<HoveredCell | null>(null)

function onCellEnter(column: number, row: number, bin: HeatmapBin): void {
  hovered.value = {
    bin,
    column,
    row,
    x: cellX(column) + binSize.value / 2,
    y: cellY(row) + binSize.value / 2
  }
}

const TOOLTIP_OFFSET = 16
const TOOLTIP_PANEL_SPRING = { type: 'spring', stiffness: 300, damping: 25 } as const

const displayed = shallowRef<HoveredCell | null>(null)
let isShowing = false

const show = useTimeoutFn(
  () => {
    isShowing = true
    displayed.value = hovered.value
  },
  () => props.showDelay,
  { immediate: false }
)

const hide = useTimeoutFn(
  () => {
    isShowing = false
    displayed.value = null
  },
  () => props.hideDelay,
  { immediate: false }
)

watch(hovered, (cell) => {
  show.stop()
  hide.stop()

  if (!cell) {
    if (props.hideDelay === 0) {
      isShowing = false
      displayed.value = null
      return
    }

    hide.start()
    return
  }

  if (isShowing || props.showDelay === 0) {
    isShowing = true
    displayed.value = cell
    return
  }

  show.start()
})

const tooltipRef = ref<HTMLDivElement | null>(null)
const { width: tooltipWidth, height: tooltipHeight } = useElementSize(tooltipRef)

// Fallbacks until the panel has been measured, matching the upstream defaults.
const panelWidth = computed(() => tooltipWidth.value || 180)
const panelHeight = computed(() => tooltipHeight.value || 80)

const tooltipFlipped = computed(
  () => (displayed.value?.x ?? 0) + panelWidth.value + TOOLTIP_OFFSET > width.value
)

const tooltipPosition = computed(() => {
  const { x, y } = displayed.value ?? { x: 0, y: 0 }
  const top = Math.min(
    y - panelHeight.value / 2,
    gridHeight.value - panelHeight.value - TOOLTIP_OFFSET
  )

  return {
    left: `${tooltipFlipped.value ? x - TOOLTIP_OFFSET - panelWidth.value : x + TOOLTIP_OFFSET}px`,
    top: `${Math.max(TOOLTIP_OFFSET, top)}px`
  }
})

const longMonthFmt = new Intl.DateTimeFormat('en-US', { month: 'long' })
const weekdayLongFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
function ordinal(day: number): string {
  const rem10 = day % 10
  const rem100 = day % 100
  if (rem10 === 1 && rem100 !== 11) {
    return `${day}st`
  }
  if (rem10 === 2 && rem100 !== 12) {
    return `${day}nd`
  }
  if (rem10 === 3 && rem100 !== 13) {
    return `${day}rd`
  }
  return `${day}th`
}
function tooltipDate(date: Date): string {
  return `${longMonthFmt.format(date)} ${ordinal(date.getDate())} ${date.getFullYear()}`
}
</script>

<template>
  <div class="heatmap-wrap">
    <div
      ref="containerRef"
      class="heatmap"
      :style="{ height: `${gridHeight}px` }"
      @pointerleave="hovered = null"
    >
      <svg v-if="width > 0" :width="width" :height="gridHeight">
        <defs v-if="patternLevels.length > 0">
          <PatternPreset
            v-for="entry in patternLevels"
            :key="entry.id"
            :id="entry.id"
            :pattern="entry.pattern"
            :options="entry.options"
          />
        </defs>

        <rect
          v-for="cell in cells"
          :key="cell.key"
          class="heatmap-cell"
          :x="cell.x"
          :y="cell.y"
          :width="binSize"
          :height="binSize"
          :rx="cornerRadius"
          :ry="cornerRadius"
          :fill="cell.fill"
          :fill-opacity="cell.fillOpacity"
          @pointerenter="onCellEnter(cell.column, cell.bin.bin, cell.bin)"
        />
      </svg>

      <span
        v-for="tick in monthTicks"
        :key="tick.key"
        class="heatmap-axis-label"
        :style="{ top: 0, left: `${tick.x}px` }"
      >
        {{ tick.label }}
      </span>

      <span
        v-for="tick in dayTicks"
        :key="tick.label"
        class="heatmap-axis-label heatmap-day-label"
        :style="{ top: `${tick.y}px`, left: 0 }"
      >
        {{ tick.label }}
      </span>

      <AnimatePresence>
        <motion.div
          v-if="displayed"
          ref="tooltipRef"
          class="heatmap-tooltip"
          :style="tooltipPosition"
          :initial="instant ? false : { opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.1 }"
        >
          <motion.div
            :key="tooltipFlipped ? 'flipped' : 'default'"
            class="heatmap-tooltip-panel"
            :style="{ transformOrigin: tooltipFlipped ? 'right top' : 'left top' }"
            :initial="instant ? false : { scale: 0.85, opacity: 0, x: tooltipFlipped ? 20 : -20 }"
            :animate="{ scale: 1, opacity: 1, x: 0 }"
            :transition="TOOLTIP_PANEL_SPRING"
          >
            <span class="heatmap-tooltip-date">
              {{ tooltipDate(displayed.bin.date) }}
            </span>
            <span class="heatmap-tooltip-weekday">
              {{ weekdayLongFmt.format(displayed.bin.date) }}
            </span>
            <span class="heatmap-tooltip-divider" />
            <span class="heatmap-tooltip-count">
              {{ props.formatLabel(displayed.bin.count, displayed.bin.date) }}
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>

    <div class="heatmap-legend">
      <span class="heatmap-legend-text">Less</span>
      <span
        v-for="(color, level) in legendColors"
        :key="level"
        class="heatmap-legend-swatch"
        :style="{ background: color, borderRadius: `${legendCornerRadius}px` }"
      />
      <span class="heatmap-legend-text">More</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.heatmap {
  position: relative;
  width: 100%;
}

.heatmap svg {
  display: block;
}

.heatmap-cell {
  animation: heatmap-cell-in 1.6s cubic-bezier(0.85, 0, 0.916, 0.282) both;
}

@keyframes heatmap-cell-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.heatmap-axis-label {
  position: absolute;
  font-size: 12px;
  color: var(--chart-label);
  white-space: nowrap;
  pointer-events: none;
}

.heatmap-day-label {
  transform: translateY(-50%);
}

.heatmap-tooltip {
  position: absolute;
  z-index: 50;
  pointer-events: none;
}

.heatmap-tooltip-panel {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--chart-tooltip-background);
  color: var(--chart-tooltip-foreground);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px 12px;
  white-space: nowrap;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.heatmap-tooltip-date {
  font-size: 12px;
  font-weight: 500;
}

.heatmap-tooltip-weekday {
  font-size: 12px;
  color: var(--chart-tooltip-muted);
}

.heatmap-tooltip-divider {
  height: 1px;
  margin: 2px 0;
  background: color-mix(in oklch, currentColor 15%, transparent);
}

.heatmap-tooltip-count {
  font-size: 14px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.heatmap-legend-swatch {
  width: 11px;
  height: 11px;
}

.heatmap-legend-text {
  font-size: 12px;
  color: var(--chart-label);
  margin: 0 4px;
}
</style>
