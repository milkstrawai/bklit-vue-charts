<script setup lang="ts">
import { computed } from 'vue'
import { useChart } from '../composables/use-chart'

interface LegendProps {
  /** "horizontal" wraps items in a row; "vertical" stacks them. Default: horizontal */
  /** Override labels (defaults to the series dataKey). */
}

const props = withDefaults(defineProps<LegendProps>(), {})

const { series, legend, setLegendHover, isSeriesHidden, toggleSeries } = useChart()

const items = computed(() =>
  series.map((entry, index) => ({
    index,
    dataKey: entry.dataKey,
    color: entry.color,
    label: entry.dataKey,
    hidden: isSeriesHidden(entry.dataKey)
  }))
)

function isFaded(index: number): boolean {
  return legend.hoveredIndex !== null && legend.hoveredIndex !== index
}
</script>

<template>
  <div class="legend">
    <button
      v-for="item in items"
      :key="item.label"
      type="button"
      class="legend-item"
      :class="{ hidden: item.hidden }"
      :style="{ opacity: item.hidden ? 0.4 : isFaded(item.index) ? 0.4 : 1 }"
      @click="toggleSeries(item.dataKey)"
      @pointerenter="setLegendHover(item.index)"
      @pointerleave="setLegendHover(null)"
      @focus="setLegendHover(item.index)"
      @blur="setLegendHover(null)"
    >
      <span class="legend-marker" :style="{ backgroundColor: item.color }" />
      <span class="legend-label">{{ item.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  transition: opacity 0.15s ease;
}

.legend-marker {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 9999px;
}

.legend-label {
  font-size: 13px;
  color: var(--chart-foreground-muted);
  text-transform: capitalize;
}

.legend-item.hidden .legend-label {
  text-decoration: line-through;
}
</style>
