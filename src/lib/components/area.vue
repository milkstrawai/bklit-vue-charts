<script setup lang="ts">
import { area, curveMonotoneX, line } from "d3-shape";
import type { CurveFactory } from "d3-shape";
import { AnimatePresence, motion } from "motion-v";
import { computed, useId } from "vue";
import { useChart } from "../composables/use-chart";
import type { ChartDatum, SeriesPointMarkerStyle } from "../context";
import { HIGHLIGHT_SPRING, useHighlightSegment } from "../composables/use-highlight-segment";

interface AreaProps {
  dataKey: string;
  /** Y-scale group for biaxial charts (pair with a matching YAxis). */
  yAxisId?: string;
  /** D3 curve factory. Default: curveMonotoneX */
  curve?: CurveFactory;
  /** Fill color. Default: var(--chart-line-primary) */
  fill?: string;
  /** Fill opacity at the top of the area. Default: 0.4 */
  fillOpacity?: number;
  /** Fill opacity at the baseline. Default: 0 */
  gradientToOpacity?: number;
  /** 0–1: where the bottom gradient stop sits (1 = full height). Default: 1 */
  gradientSpan?: number;
  /** Stroke color; defaults to `fill`. */
  stroke?: string;
  strokeWidth?: number;
  /** Skip the entrance reveal when false. Default: true */
  animate?: boolean;
  /** Draw the line on top of the fill. Default: true */
  showLine?: boolean;
  /** Fade fill + stroke toward transparent at the chart edges. Default: false */
  fadeEdges?: boolean;
  showHighlight?: boolean;
  /** Render ring markers at each data point. Default: false */
  showMarkers?: boolean;
  /** Point-marker styling (radius, fill, stroke, strokeWidth). */
  markers?: SeriesPointMarkerStyle;
  /** Print each point's value above it. Default: false */
}

const props = withDefaults(defineProps<AreaProps>(), {
  curve: curveMonotoneX,
  animate: true,
  fill: "var(--chart-line-primary)",
  fillOpacity: 0.4,
  gradientToOpacity: 0,
  gradientSpan: 1,
  stroke: undefined,
  strokeWidth: 2,
  showLine: true,
  fadeEdges: false,
  showHighlight: true,
  showMarkers: false,
  markers: undefined,
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
  registerSeries,
  isSeriesHidden,
  revealClipId,
} = useChart();

const hidden = computed(() => isSeriesHidden(props.dataKey));
const yScale = computed(() => getYScale(props.yAxisId));
const resolvedStroke = computed(() => props.stroke ?? props.fill);
const midOffset = computed(
  () => `${Math.min(1, Math.max(0.01, props.gradientSpan)) * 100}%`
);

registerSeries({
  dataKey: props.dataKey,
  color: resolvedStroke.value,
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
  stroke: props.markers?.stroke ?? resolvedStroke.value,
  strokeWidth: props.markers?.strokeWidth ?? 2,
}));


const areaD = computed(
  () =>
    area<ChartDatum>()
      .x((d) => xScale.value(xAccessor(d)))
      .y0(innerHeight.value)
      .y1((d) => yScale.value(d[props.dataKey] as number))
      .curve(props.curve)(renderData.value) ?? ""
);

const lineD = computed(
  () =>
    line<ChartDatum>()
      .x((d) => xScale.value(xAccessor(d)))
      .y((d) => yScale.value(d[props.dataKey] as number))
      .curve(props.curve)(renderData.value) ?? ""
);

const uid = useId();
const fillGradientId = `area-fill-${props.dataKey}-${uid}`;
const strokeGradientId = `area-stroke-${props.dataKey}-${uid}`;
const edgeGradientId = `area-edge-${props.dataKey}-${uid}`;
const edgeMaskId = `area-edge-mask-${props.dataKey}-${uid}`;

const visibleStroke = computed(() =>
  props.fadeEdges ? `url(#${strokeGradientId})` : resolvedStroke.value
);

const highlightClipId = `area-highlight-${props.dataKey}-${uid}`;
const { segmentBounds, hoverEpoch } = useHighlightSegment({
  data,
  xScale,
  xAccessor,
  hover,
});

const showHighlightStroke = computed(() => props.showHighlight && props.showLine);
</script>

<template>
  <g
    v-if="!hidden"
    :clip-path="animate && revealClipId ? `url(#${revealClipId})` : undefined"
  >
    <defs>
      <linearGradient :id="fillGradientId" x1="0%" x2="0%" y1="0%" y2="100%">
        <stop offset="0%" :stop-color="fill" :stop-opacity="fillOpacity" />
        <stop
          :offset="midOffset"
          :stop-color="fill"
          :stop-opacity="gradientToOpacity"
        />
        <stop
          v-if="gradientSpan < 1"
          offset="100%"
          :stop-color="fill"
          :stop-opacity="gradientToOpacity"
        />
      </linearGradient>

      <template v-if="fadeEdges">
        <linearGradient
          :id="strokeGradientId"
          gradientUnits="userSpaceOnUse"
          :x1="0"
          :x2="innerWidth"
          y1="0"
          y2="0"
        >
          <stop offset="0%" :stop-color="resolvedStroke" stop-opacity="0" />
          <stop offset="15%" :stop-color="resolvedStroke" stop-opacity="1" />
          <stop offset="85%" :stop-color="resolvedStroke" stop-opacity="1" />
          <stop offset="100%" :stop-color="resolvedStroke" stop-opacity="0" />
        </linearGradient>
        <linearGradient
          :id="edgeGradientId"
          gradientUnits="userSpaceOnUse"
          :x1="0"
          :x2="innerWidth"
          y1="0"
          y2="0"
        >
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="15%" stop-color="white" stop-opacity="1" />
          <stop offset="85%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>
        <mask :id="edgeMaskId">
          <rect
            :width="innerWidth"
            :height="innerHeight"
            x="0"
            y="0"
            :fill="`url(#${edgeGradientId})`"
          />
        </mask>
      </template>
    </defs>

    <motion.g
      :initial="{ opacity: 1 }"
      :animate="{ opacity: dimmed ? 0.6 : 1 }"
      :transition="{ duration: 0.4, ease: 'easeInOut' }"
    >
      <path
        :d="areaD"
        :fill="`url(#${fillGradientId})`"
        :mask="fadeEdges ? `url(#${edgeMaskId})` : undefined"
      />
      <path
        v-if="showLine"
        :d="lineD"
        fill="none"
        :stroke="visibleStroke"
        :stroke-width="strokeWidth"
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

    <template v-if="showHighlightStroke">
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
          :d="lineD"
          fill="none"
          :stroke="resolvedStroke"
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
