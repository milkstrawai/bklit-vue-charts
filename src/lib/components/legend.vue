<script setup lang="ts">
import { computed } from 'vue'
import { useChart } from '../composables/use-chart'

const { series } = useChart()

const items = computed(() =>
  series.map((entry) => ({
    color: entry.color,
    label: entry.dataKey
  }))
)
</script>

<template>
  <div class="legend">
    <span v-for="item in items" :key="item.label" class="legend-item">
      <span class="legend-marker" :style="{ backgroundColor: item.color }" />
      <span class="legend-label">{{ item.label }}</span>
    </span>
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
  font: inherit;
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
</style>
