<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import { getHeatmapContributionLevel } from '../utils/heatmap-utils'
import type { HeatmapBin, HeatmapColumn } from '../utils/heatmap-utils'

interface HeatmapChartProps {
  data: HeatmapColumn[]
  gap?: number
  /**
   * Map a bin's `count` to a 0–4 intensity. Override when `count` carries a
   * domain value (revenue, savings) rather than an event tally.
   */
  level?: (count: number) => number
  /** Tooltip text for a bin's `count`. Default: "12 contributions". */
  formatValue?: (count: number) => string
}

const props = withDefaults(defineProps<HeatmapChartProps>(), {
  gap: 2,
  level: getHeatmapContributionLevel,
  formatValue: (count: number) => `${count} contribution${count === 1 ? '' : 's'}`
})

const LEVEL_COLORS = [
  'var(--chart-scale-01)',
  'var(--chart-scale-02)',
  'var(--chart-scale-03)',
  'var(--chart-scale-04)',
  'var(--chart-scale-05)'
]

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
        <template v-for="(column, columnIndex) in data" :key="column.bin">
          <template v-for="bin in column.bins" :key="bin.bin">
            <rect
              v-if="bin.count >= 0"
              class="heatmap-cell"
              :x="cellX(columnIndex)"
              :y="cellY(bin.bin)"
              :width="binSize"
              :height="binSize"
              :rx="2"
              :fill="LEVEL_COLORS[props.level(bin.count)]"
              @pointerenter="onCellEnter(columnIndex, bin.bin, bin)"
            />
          </template>
        </template>
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

      <div
        v-if="hovered"
        class="heatmap-tooltip"
        :style="{ left: `${hovered.x}px`, top: `${hovered.y - 8}px` }"
      >
        <span class="heatmap-tooltip-date">
          {{ tooltipDate(hovered.bin.date) }}
        </span>
        <span class="heatmap-tooltip-weekday">
          {{ weekdayLongFmt.format(hovered.bin.date) }}
        </span>
        <span class="heatmap-tooltip-divider" />
        <span class="heatmap-tooltip-count">
          {{ props.formatValue(hovered.bin.count) }}
        </span>
      </div>
    </div>

    <div class="heatmap-legend">
      <span class="heatmap-legend-text">Less</span>
      <span
        v-for="color in LEVEL_COLORS"
        :key="color"
        class="heatmap-legend-swatch"
        :style="{ background: color }"
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
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 8px;
  background: var(--chart-tooltip-background);
  color: var(--chart-tooltip-foreground);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px 12px;
  pointer-events: none;
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
  border-radius: 2px;
}

.heatmap-legend-text {
  font-size: 12px;
  color: var(--chart-label);
  margin: 0 4px;
}
</style>
