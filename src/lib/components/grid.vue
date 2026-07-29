<script setup lang="ts">
import { motion } from "motion-v";
import { computed, useId } from "vue";
import { useChart } from "../composables/use-chart";

interface GridProps {
  /** Show horizontal grid lines. Default: true */
  horizontal?: boolean;
  /** Show vertical grid lines (time-series charts). Default: false */
  vertical?: boolean;
  /** Number of horizontal lines. Default: 5 */
  numTicksRows?: number;
  numTicksColumns?: number;
  /** Explicit y values for horizontal lines (overrides numTicksRows). */
  rowTickValues?: number[];
  /** Y-scale group for the horizontal lines. */
  yAxisId?: string;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
  fadeHorizontal?: boolean;
  /** Fade vertical lines at the top/bottom edges. Default: false */
  fadeVertical?: boolean;
  /** Omit the first + last horizontal lines. Default: false */
  hideHorizontalEdgeLines?: boolean;
  /** Omit the first + last vertical lines. Default: false */
  hideVerticalEdgeLines?: boolean;
  /** Draw emphasized lines at these y values (e.g. [0] for break-even). */
  highlightRowValues?: number[];
  highlightRowStroke?: string;
  highlightRowStrokeOpacity?: number;
  highlightRowStrokeWidth?: number;
  highlightRowStrokeDasharray?: string;
}

const props = withDefaults(defineProps<GridProps>(), {
  horizontal: true,
  vertical: false,
  numTicksRows: 5,
  numTicksColumns: 10,
  rowTickValues: undefined,
  yAxisId: undefined,
  stroke: "var(--chart-grid)",
  strokeOpacity: 1,
  strokeWidth: 1,
  strokeDasharray: "4,4",
  fadeHorizontal: true,
  fadeVertical: false,
  hideHorizontalEdgeLines: false,
  hideVerticalEdgeLines: false,
  highlightRowValues: undefined,
  highlightRowStroke: "var(--chart-foreground-muted)",
  highlightRowStrokeOpacity: 1,
  highlightRowStrokeWidth: 1,
  highlightRowStrokeDasharray: "0",
});

const { xScale, getYScale, innerWidth, innerHeight, status } = useChart();

const yScale = computed(() => getYScale(props.yAxisId));

const isLoading = computed(() => status.value === "loading");
const shimmerId = `grid-shimmer-${useId()}`;
const shimmerWidth = 140;

function trimEdges<T>(items: T[], hide: boolean): T[] {
  return hide && items.length > 2 ? items.slice(1, -1) : items;
}

const columnTicks = computed(() => {
  if (!props.vertical) {
    return [];
  }
  const scale = xScale.value as unknown as {
    ticks?: (count: number) => Date[];
  };
  const raw = scale.ticks?.(props.numTicksColumns) ?? [];
  return trimEdges(raw, props.hideVerticalEdgeLines).map((tick) => ({
    key: tick.getTime(),
    x: xScale.value(tick),
  }));
});

const ticks = computed(() => {
  const raw = props.rowTickValues ?? yScale.value.ticks(props.numTicksRows);
  return trimEdges(raw, props.hideHorizontalEdgeLines);
});
const gradientId = `grid-fade-${useId()}`;
const columnGradientId = `grid-fade-col-${useId()}`;
const lineStroke = computed(() =>
  props.fadeHorizontal ? `url(#${gradientId})` : props.stroke
);
const columnStroke = computed(() =>
  props.fadeVertical ? `url(#${columnGradientId})` : props.stroke
);
</script>

<template>
  <g>
    <defs>
      <linearGradient
        v-if="fadeHorizontal"
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="0"
        :x2="innerWidth"
        y1="0"
        y2="0"
      >
        <stop offset="0%" :stop-color="stroke" stop-opacity="0" />
        <stop offset="10%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="90%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
      </linearGradient>
      <linearGradient
        v-if="fadeVertical"
        :id="columnGradientId"
        gradientUnits="userSpaceOnUse"
        x1="0"
        x2="0"
        :y1="0"
        :y2="innerHeight"
      >
        <stop offset="0%" :stop-color="stroke" stop-opacity="0" />
        <stop offset="10%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="90%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
      </linearGradient>
    </defs>
    <template v-if="horizontal">
      <line
        v-for="tick in ticks"
        :key="tick"
        :x1="0"
        :x2="innerWidth"
        :y1="yScale(tick)"
        :y2="yScale(tick)"
        :stroke="lineStroke"
        :stroke-opacity="strokeOpacity"
        :stroke-dasharray="strokeDasharray"
        :stroke-width="strokeWidth"
      />
    </template>
    <template v-if="vertical">
      <line
        v-for="tick in columnTicks"
        :key="tick.key"
        :x1="tick.x"
        :x2="tick.x"
        :y1="0"
        :y2="innerHeight"
        :stroke="columnStroke"
        :stroke-opacity="strokeOpacity"
        :stroke-dasharray="strokeDasharray"
        :stroke-width="strokeWidth"
      />
    </template>
    <template v-if="highlightRowValues">
      <line
        v-for="value in highlightRowValues"
        :key="`hl-${value}`"
        :x1="0"
        :x2="innerWidth"
        :y1="yScale(value)"
        :y2="yScale(value)"
        :stroke="highlightRowStroke"
        :stroke-opacity="highlightRowStrokeOpacity"
        :stroke-dasharray="highlightRowStrokeDasharray"
        :stroke-width="highlightRowStrokeWidth"
      />
    </template>

    <template v-if="isLoading">
      <defs>
        <linearGradient :id="shimmerId" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stop-color="var(--chart-grid)" stop-opacity="0" />
          <stop offset="50%" stop-color="var(--chart-grid)" stop-opacity="0.9" />
          <stop offset="100%" stop-color="var(--chart-grid)" stop-opacity="0" />
        </linearGradient>
        <clipPath :id="`${shimmerId}-rows`">
          <rect
            v-for="tick in ticks"
            :key="tick"
            :x="0"
            :y="yScale(tick) - 1"
            :width="innerWidth"
            :height="2"
          />
        </clipPath>
      </defs>
      <motion.rect
        :y="0"
        :height="innerHeight"
        :width="shimmerWidth"
        :fill="`url(#${shimmerId})`"
        :clip-path="`url(#${shimmerId}-rows)`"
        :initial="{ x: -shimmerWidth }"
        :animate="{ x: innerWidth }"
        :transition="{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }"
      />
    </template>
  </g>
</template>
