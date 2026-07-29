<script setup lang="ts">
import { motion } from "motion-v";
import { computed, useId } from "vue";
import { useChart } from "../composables/use-chart";

type BackgroundPattern =
  | "diagonal"
  | "horizontal"
  | "vertical"
  | "cross"
  | "dots"
  | "circles"
  | "accent"
  | "none";

interface BackgroundProps {
  /** Pattern preset. "none" renders nothing. Default: "diagonal" */
  pattern?: BackgroundPattern;
  /** Pattern stroke/fill color. Default: var(--chart-grid) */
  color?: string;
  /** Fill opacity. Default: 1 */
  opacity?: number;
  /** Texture scale — multiplies the per-preset tile size. Default: 1 */
  scale?: number;
  /** Stroke width for line patterns. Defaults to the per-preset base × `scale`. */
  strokeWidth?: number;
}

const props = withDefaults(defineProps<BackgroundProps>(), {
  pattern: "diagonal",
  color: "var(--chart-grid)",
  opacity: 1,
  scale: 1,
  strokeWidth: undefined,
});

const { innerWidth, innerHeight, animationDurationMs } = useChart();

const TILE_BASE: Record<BackgroundPattern, number> = {
  diagonal: 6,
  horizontal: 6,
  vertical: 6,
  cross: 8,
  dots: 10,
  circles: 6,
  accent: 6,
  none: 0,
};
const size = computed(() => TILE_BASE[props.pattern] * props.scale);

// Per-preset base stroke, scaled — dots are fill-only upstream.
const STROKE_BASE: Record<BackgroundPattern, number> = {
  diagonal: 1,
  horizontal: 1,
  vertical: 1,
  cross: 1,
  dots: 0,
  circles: 1,
  accent: 1,
  none: 0,
};
const resolvedStrokeWidth = computed(
  () => props.strokeWidth ?? STROKE_BASE[props.pattern] * props.scale
);

const dotRadius = computed(() => Math.max(0.5, 1.5 * props.scale));
const circleRadius = computed(() => 2 * props.scale);
const ACCENT_COLOR = "#e879f9";

const patternId = `chart-bg-${useId().replace(/:/g, "")}`;
const revealDelay = computed(() => animationDurationMs.value / 1000);
</script>

<template>
  <g v-if="pattern !== 'none'">
    <defs>
      <pattern
        :id="patternId"
        patternUnits="userSpaceOnUse"
        :width="size"
        :height="size"
      >
        <template v-if="pattern === 'dots'">
          <circle :cx="size / 2" :cy="size / 2" :r="dotRadius" :fill="color" />
        </template>
        <template v-else-if="pattern === 'circles'">
          <circle
            :cx="size / 2"
            :cy="size / 2"
            :r="circleRadius"
            fill="none"
            :stroke="color"
            :stroke-width="resolvedStrokeWidth"
          />
        </template>
        <template v-else-if="pattern === 'horizontal'">
          <line :x1="0" :y1="size / 2" :x2="size" :y2="size / 2" :stroke="color" :stroke-width="resolvedStrokeWidth" />
        </template>
        <template v-else-if="pattern === 'vertical'">
          <line :x1="size / 2" :y1="0" :x2="size / 2" :y2="size" :stroke="color" :stroke-width="resolvedStrokeWidth" />
        </template>
        <template v-else-if="pattern === 'cross'">
          <path :d="`M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}`" :stroke="color" :stroke-width="resolvedStrokeWidth" />
        </template>
        <template v-else-if="pattern === 'accent'">
          <path :d="`M 0 ${size} L ${size} 0`" :stroke="ACCENT_COLOR" :stroke-width="resolvedStrokeWidth" />
        </template>
        <template v-else>
          <path :d="`M 0 ${size} L ${size} 0`" :stroke="color" :stroke-width="resolvedStrokeWidth" />
        </template>
      </pattern>
    </defs>
    <motion.rect
      :width="innerWidth"
      :height="innerHeight"
      x="0"
      y="0"
      :fill="`url(#${patternId})`"
      :initial="{ opacity: 0 }"
      :animate="{ opacity }"
      :transition="{ duration: 0.6, delay: revealDelay, ease: 'easeOut' }"
    />
  </g>
</template>
