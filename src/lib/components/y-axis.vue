<script setup lang="ts">
import { computed } from 'vue'
import { useChart } from '../composables/use-chart'
import { compactNumber } from '../utils/chart-formatters'

interface YAxisProps {
  /** Scale group to label. Default: the primary ("left") axis. */
  yAxisId?: string
  /** Which margin to render labels in. Default: "left" */
  orientation?: 'left' | 'right'
  /** Approximate tick count hint for d3 `scale.ticks()`. Default: 5 */
  numTicks?: number
  /** Format large numbers (1000 → "1k"). Default: true */
  formatLargeNumbers?: boolean
  /** Custom formatter (e.g. USD); overrides formatLargeNumbers. */
  formatValue?: (value: number) => string
}

const props = withDefaults(defineProps<YAxisProps>(), {
  yAxisId: undefined,
  orientation: 'left',
  numTicks: 5,
  formatLargeNumbers: true,
  formatValue: undefined
})

const { getYScale, innerWidth } = useChart()
const yScale = computed(() => getYScale(props.yAxisId))
const isLeft = computed(() => props.orientation === 'left')

function label(value: number): string {
  if (props.formatValue) {
    return props.formatValue(value)
  }
  return props.formatLargeNumbers ? compactNumber(value) : String(value)
}

const ticks = computed(() =>
  yScale.value.ticks(props.numTicks).map((value) => ({
    value,
    y: yScale.value(value),
    label: label(value)
  }))
)
</script>

<template>
  <g aria-hidden="true">
    <text
      v-for="tick in ticks"
      :key="tick.value"
      :x="isLeft ? -8 : innerWidth + 8"
      :y="tick.y"
      :text-anchor="isLeft ? 'end' : 'start'"
      dominant-baseline="middle"
      class="y-axis-label"
    >
      {{ tick.label }}
    </text>
  </g>
</template>

<style scoped>
.y-axis-label {
  fill: var(--chart-label);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
