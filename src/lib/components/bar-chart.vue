<script setup lang="ts">
import { max } from "d3-array";
import { scaleBand } from "d3-scale";
import { computed } from "vue";
import type { ComputedRef } from "vue";
import { DEFAULT_Y_AXIS_ID } from "../context";
import type { ChartDatum, XScale, YScale } from "../context";
import { chartShellProps, useChartShell } from "../composables/use-chart-shell";

const props = defineProps({
  ...chartShellProps("month"),
  /** Gap between bar groups as a fraction of band width. Default: 0.2 */
  barGap: { type: Number, default: 0.2 },
  /** Stack series instead of grouping them. Default: false */
  stacked: { type: Boolean, default: false },
  /** Gap between stacked segments in pixels. Default: 0 */
  stackGap: { type: Number, default: 0 },
});

const {
  containerRef,
  width,
  height,
  innerWidth,
  commitHover,
  clearHover,
  xAccessor,
  plotX,
  series,
  makeYScales,
  provideContext,
} = useChartShell(props);

const categoryAccessor = (datum: ChartDatum): string =>
  String(xAccessor(datum));

const xScale = computed(() =>
  scaleBand()
    .domain(props.data.map(categoryAccessor))
    .range([0, innerWidth.value])
    .paddingInner(props.barGap)
    .paddingOuter(props.barGap)
);

const yScales = makeYScales((keys) => {
  const hi =
    max(props.data, (d) =>
      props.stacked
        ? keys.reduce((sum, k) => sum + (d[k] as number), 0)
        : max(keys, (k) => d[k] as number)
    ) ?? 1;
  return [0, hi * 1.1];
});
const getYScale = (yAxisId: string = DEFAULT_Y_AXIS_ID): YScale =>
  yScales.value[yAxisId] ?? yScales.value[DEFAULT_Y_AXIS_ID];
const yScale = computed(() => getYScale());

function stackBase(datum: ChartDatum, dataKey: string): number {
  let sum = 0;
  for (const s of series) {
    if (s.dataKey === dataKey) {
      break;
    }
    sum += (datum[s.dataKey] as number) ?? 0;
  }
  return sum;
}

const bandCenter = (datum: ChartDatum): number =>
  (xScale.value(categoryAccessor(datum)) ?? 0) + xScale.value.bandwidth() / 2;

function onPointerMove(event: PointerEvent): void {
  const px = plotX(event);
  if (px === null) {
    clearHover();
    return;
  }
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  props.data.forEach((datum, i) => {
    const dist = Math.abs(px - bandCenter(datum));
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  commitHover(best, bandCenter(props.data[best]));
}

provideContext({
  renderData: computed(() => props.data),
  xScale: xScale as unknown as ComputedRef<XScale>,
  yScale,
  yScales,
  getYScale,
  bar: {
    stacked: props.stacked,
    stackGap: props.stackGap,
    stackBase,
  },
});
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
        <g :transform="`translate(${margin.left},${margin.top})`">
          <slot />
        </g>
      </svg>
      <div v-if="data.length === 0 && status !== 'loading'" class="chart-empty">
        {{ emptyLabel }}
      </div>
    </div>
    <slot name="overlay" />
  </div>
</template>
