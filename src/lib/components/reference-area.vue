<script setup lang="ts">
import { computed } from "vue";
import { useChart } from "../composables/use-chart";
import type { XValue } from "../context";
import {
  computeReferenceAreaRect,
  type ReferenceAreaIfOverflow,
} from "../utils/reference-area-geometry";

interface ReferenceAreaProps {
  /** Lower y bound (extends to plot top when omitted). */
  y1?: number;
  /** Upper y bound (extends to plot bottom when omitted). */
  y2?: number;
  /** Left x bound (extends to plot left when omitted). */
  x1?: XValue;
  /** Right x bound (extends to plot right when omitted). */
  x2?: XValue;
  /** Y-scale group for `y1`/`y2`. Default: "left". */
  yAxisId?: string;
  /** How to handle a band that spills past the plot. Default: "hidden" (clamp). */
  ifOverflow?: ReferenceAreaIfOverflow;
  fill?: string;
  fillOpacity?: number;
}

const props = withDefaults(defineProps<ReferenceAreaProps>(), {
  y1: undefined,
  y2: undefined,
  x1: undefined,
  x2: undefined,
  yAxisId: undefined,
  ifOverflow: "hidden",
  fill: "color-mix(in oklch, var(--chart-foreground-muted) 12%, transparent)",
  fillOpacity: 1,
});

const { xScale, getYScale, innerWidth, innerHeight } = useChart();

const hasBounds = computed(
  () =>
    props.y1 !== undefined ||
    props.y2 !== undefined ||
    props.x1 !== undefined ||
    props.x2 !== undefined
);

const rect = computed(() =>
  hasBounds.value
    ? computeReferenceAreaRect({
        innerWidth: innerWidth.value,
        innerHeight: innerHeight.value,
        x1: props.x1,
        x2: props.x2,
        y1: props.y1,
        y2: props.y2,
        ifOverflow: props.ifOverflow,
        xScale: xScale.value,
        yScale: getYScale(props.yAxisId),
      })
    : null
);
</script>

<template>
  <g v-if="rect">
    <rect
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :fill="fill"
      :fill-opacity="fillOpacity"
    />
  </g>
</template>

<style scoped>
</style>
