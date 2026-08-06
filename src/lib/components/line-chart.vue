<script setup lang="ts">
import TimeSeriesChartShell from './time-series-chart-shell.vue'
import { timeSeriesChartProps } from './time-series-chart-props'

const props = defineProps(timeSeriesChartProps())
</script>

<template>
  <TimeSeriesChartShell v-bind="props" domain-series-kind="line">
    <slot />
    <template #overlay><slot name="overlay" /></template>
  </TimeSeriesChartShell>
</template>
