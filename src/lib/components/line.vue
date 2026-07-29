<script setup lang="ts">
import { curveNatural, line } from "d3-shape";
import type { CurveFactory } from "d3-shape";
import { AnimatePresence, motion } from "motion-v";
import { computed, useId } from "vue";
import { useChart } from "../composables/use-chart";
import type { ChartDatum, SeriesPointMarkerStyle } from "../context";
import { HIGHLIGHT_SPRING, useHighlightSegment } from "../composables/use-highlight-segment";

interface LineProps {
  dataKey: string;
  /** Y-scale group for biaxial charts (pair with a matching YAxis). */
  yAxisId?: string;
  stroke?: string;
  strokeWidth?: number;
  /** D3 curve factory. Default: curveNatural */
  curve?: CurveFactory;
  /** Skip the entrance reveal when false. Default: true */
  animate?: boolean;
  fadeEdges?: boolean;
  /** Brighter re-stroke of the hovered segment */
  showHighlight?: boolean;
  /** Render ring markers at each data point. Default: false */
  showMarkers?: boolean;
  /** Point-marker styling (radius, fill, stroke, strokeWidth). */
  markers?: SeriesPointMarkerStyle;
  /** Inclusive data index where a dashed tail begins. */
  dashFromIndex?: number;
  /** Dash pattern for the tail segment. Default: "6,4" */
  dashArray?: string;
  /** Print each point's value above it. Default: false */
}

const props = withDefaults(defineProps<LineProps>(), {
  stroke: "var(--chart-line-primary)",
  strokeWidth: 2.5,
  curve: curveNatural,
  animate: true,
  fadeEdges: true,
  showHighlight: true,
  showMarkers: false,
  markers: undefined,
  dashFromIndex: undefined,
  dashArray: "6,4",
});

const {
  data,
  renderData,
  xScale,
  getYScale,
  innerWidth,
  innerHeight,
  xAccessor,
  hover,
  legend,
  series,
  status,
  registerSeries,
  isSeriesHidden,
  revealClipId,
} = useChart();

const hidden = computed(() => isSeriesHidden(props.dataKey));
const yScale = computed(() => getYScale(props.yAxisId));

registerSeries({
  dataKey: props.dataKey,
  color: props.stroke,
  yAxisId: props.yAxisId,
});

const seriesIndex = computed(() =>
  Math.max(0, series.findIndex((s) => s.dataKey === props.dataKey))
);
const dimmed = computed(
  () =>
    (props.showHighlight && hover.active) ||
    (legend.hoveredIndex !== null && legend.hoveredIndex !== seriesIndex.value)
);

function pathFor(rows: ChartDatum[]): string {
  return (
    line<ChartDatum>()
      .x((d) => xScale.value(xAccessor(d)))
      .y((d) => yScale.value(d[props.dataKey] as number))
      .curve(props.curve)(rows) ?? ""
  );
}

const solidPathD = computed(() => {
  if (props.dashFromIndex === undefined) {
    return pathFor(renderData.value);
  }
  return pathFor(renderData.value.slice(0, props.dashFromIndex + 1));
});
const dashPathD = computed(() =>
  props.dashFromIndex === undefined
    ? ""
    : pathFor(renderData.value.slice(props.dashFromIndex))
);
const pathD = computed(() => pathFor(renderData.value));

const markerPoints = computed(() =>
  props.showMarkers
    ? renderData.value.map((d, i) => ({
        key: i,
        cx: xScale.value(xAccessor(d)),
        cy: yScale.value(d[props.dataKey] as number),
      }))
    : []
);
const markerStyle = computed(() => ({
  radius: props.markers?.radius ?? 5,
  fill: props.markers?.fill ?? "var(--chart-background)",
  stroke: props.markers?.stroke ?? props.stroke,
  strokeWidth: props.markers?.strokeWidth ?? 2,
}));


const gradientId = `line-fade-${props.dataKey}-${useId()}`;
const visibleStroke = computed(() =>
  props.fadeEdges ? `url(#${gradientId})` : props.stroke
);

const highlightClipId = `highlight-clip-${props.dataKey}-${useId()}`;
const { segmentBounds, hoverEpoch } = useHighlightSegment({
  data,
  xScale,
  xAccessor,
  hover,
});

const isLoading = computed(() => status.value === "loading");
const isFirstSeries = computed(() => seriesIndex.value === 0);
const pulseClipId = `line-pulse-${props.dataKey}-${useId()}`;
const pulseFadeId = `line-pulse-fade-${props.dataKey}-${useId()}`;

const PULSE_CLIP_PADDING = 10;
const PULSE_CYCLE_S = 2.2;
const PULSE_PAUSE_S = 0.28;
const PULSE_EASE = [0.85, 0, 0.15, 1] as const;

const paddedFullWidth = computed(() => innerWidth.value + PULSE_CLIP_PADDING * 2);
const pulseRightEdge = computed(() => innerWidth.value + PULSE_CLIP_PADDING);

const SKELETON_POINTS = 7;
const skeletonD = computed(() => {
  const w = innerWidth.value;
  const h = innerHeight.value;
  if (w <= 0) {
    return "";
  }
  const raw = Array.from(
    { length: SKELETON_POINTS },
    (_, i) => 110 + Math.sin(i * 1.15) * 36 + i * 9
  );
  const lo = Math.min(...raw);
  const hi = Math.max(...raw);
  const span = hi - lo || 1;
  const points = raw.map((v, i) => {
    const x = (i / (SKELETON_POINTS - 1)) * w;
    const y = h * 0.85 - ((v - lo) / span) * h * 0.7;
    return [x, y] as [number, number];
  });
  return (
    line<[number, number]>()
      .x((p) => p[0])
      .y((p) => p[1])
      .curve(curveNatural)(points) ?? ""
  );
});
</script>

<template>
  <g v-if="!hidden && isLoading">
    <template v-if="isFirstSeries">
      <defs>
        <clipPath :id="pulseClipId">
          <motion.rect
            :y="-PULSE_CLIP_PADDING"
            :height="innerHeight + PULSE_CLIP_PADDING * 2"
            :initial="{ x: -PULSE_CLIP_PADDING, width: 0 }"
            :animate="{
              x: [-PULSE_CLIP_PADDING, -PULSE_CLIP_PADDING, pulseRightEdge],
              width: [0, paddedFullWidth, 0],
            }"
            :transition="{
              duration: PULSE_CYCLE_S,
              ease: PULSE_EASE,
              times: [0, 0.5, 1],
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: PULSE_PAUSE_S,
            }"
          />
        </clipPath>
        <linearGradient
          :id="pulseFadeId"
          gradientUnits="userSpaceOnUse"
          :x1="0"
          :x2="innerWidth"
          y1="0"
          y2="0"
        >
          <stop offset="0%" stop-color="var(--foreground)" stop-opacity="0" />
          <stop offset="15%" stop-color="var(--foreground)" stop-opacity="0.5" />
          <stop offset="85%" stop-color="var(--foreground)" stop-opacity="0.5" />
          <stop offset="100%" stop-color="var(--foreground)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path
        :d="skeletonD"
        fill="none"
        :stroke="`url(#${pulseFadeId})`"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :clip-path="`url(#${pulseClipId})`"
      />
    </template>
  </g>

  <g
    v-else-if="!hidden"
    :clip-path="animate && revealClipId ? `url(#${revealClipId})` : undefined"
  >
    <defs v-if="fadeEdges">
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="0"
        :x2="innerWidth"
        y1="0"
        y2="0"
      >
        <stop offset="0%" :stop-color="stroke" stop-opacity="0" />
        <stop offset="15%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="85%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
      </linearGradient>
    </defs>
    <motion.g
      :initial="{ opacity: 1 }"
      :animate="{ opacity: dimmed ? 0.3 : 1 }"
      :transition="{ duration: 0.4, ease: 'easeInOut' }"
    >
      <path
        :d="solidPathD"
        fill="none"
        :stroke="visibleStroke"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
      <path
        v-if="dashFromIndex !== undefined"
        :d="dashPathD"
        fill="none"
        :stroke="visibleStroke"
        :stroke-width="strokeWidth"
        :stroke-dasharray="dashArray"
        stroke-linecap="round"
      />
      <circle
        v-for="point in markerPoints"
        :key="point.key"
        :cx="point.cx"
        :cy="point.cy"
        :r="markerStyle.radius"
        :fill="markerStyle.fill"
        :stroke="markerStyle.stroke"
        :stroke-width="markerStyle.strokeWidth"
      />
    </motion.g>

    <template v-if="showHighlight">
      <defs>
        <clipPath :id="highlightClipId">
          <motion.rect
            :key="hoverEpoch"
            :height="innerHeight"
            :y="0"
            :initial="{ x: segmentBounds.x, width: segmentBounds.width }"
            :animate="{ x: segmentBounds.x, width: segmentBounds.width }"
            :transition="HIGHLIGHT_SPRING"
          />
        </clipPath>
      </defs>
      <AnimatePresence>
        <motion.path
          v-if="hover.active"
          :d="pathD"
          fill="none"
          :stroke="stroke"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          :clip-path="`url(#${highlightClipId})`"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.4, ease: 'easeInOut' }"
        />
      </AnimatePresence>
    </template>
  </g>
</template>

<style scoped>
</style>
