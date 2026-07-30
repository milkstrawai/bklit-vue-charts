<script setup lang="ts">
import { computed } from 'vue'
import { useChart } from '../composables/use-chart'
import { xLabel } from '../utils/chart-formatters'

interface BarXAxisProps {
  /** Half-width of the tooltip date pill, for fade calculation. Default: 50 */
  tickerHalfWidth?: number
  /** Show every label, ignoring `maxLabels`. Default: false */
  showAllLabels?: boolean
  /** Max labels to show before thinning. Default: 12 */
  maxLabels?: number
}

const props = withDefaults(defineProps<BarXAxisProps>(), {
  tickerHalfWidth: 50,
  showAllLabels: false,
  maxLabels: 12
})

const { data, xScale, xAccessor, hover, margin, containerRef } = useChart()

interface BarTick {
  key: string
  x: number
  label: string
}

/** One label per bar, centered on its band; thinned to `maxLabels`. */
const ticks = computed<BarTick[]>(() => {
  const scale = xScale.value
  const bandwidth = scale.bandwidth?.()
  if (bandwidth === undefined) {
    return []
  }

  const all = data.value.map((datum) => {
    const x = xAccessor(datum)
    return {
      key: String(x),
      x: scale(x) + bandwidth / 2,
      label: xLabel(x)
    }
  })

  if (props.showAllLabels || all.length <= props.maxLabels) {
    return all
  }
  const step = Math.ceil(all.length / props.maxLabels)
  return all.filter((_, i) => i % step === 0)
})

const FADE_BUFFER = 20
function labelOpacity(tick: BarTick): number {
  if (!hover.active) {
    return 1
  }
  const distance = Math.abs(tick.x - hover.x)
  if (distance < props.tickerHalfWidth) {
    return 0
  }
  if (distance < props.tickerHalfWidth + FADE_BUFFER) {
    return (distance - props.tickerHalfWidth) / FADE_BUFFER
  }
  return 1
}
</script>

<template>
  <foreignObject width="0" height="0">
    <Teleport v-if="containerRef" :to="containerRef">
      <div class="bar-x-axis" aria-hidden="true">
        <div
          v-for="tick in ticks"
          :key="tick.key"
          class="bar-x-axis-tick"
          :style="{ left: `${tick.x + margin.left}px` }"
        >
          <span class="bar-x-axis-label" :style="{ opacity: labelOpacity(tick) }">
            {{ tick.label }}
          </span>
        </div>
      </div>
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.bar-x-axis {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bar-x-axis-tick {
  position: absolute;
  bottom: 12px;
  width: 0;
  display: flex;
  justify-content: center;
}

.bar-x-axis-label {
  white-space: nowrap;
  font-size: 12px;
  color: var(--chart-label);
  font-variant-numeric: tabular-nums;
  transition: opacity 0.4s ease-in-out;
}
</style>
