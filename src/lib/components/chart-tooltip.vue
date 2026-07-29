<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, useId } from "vue";
import { useChart } from "../composables/use-chart";
import type { ChartDatum } from "../context";
import DateTicker from "../components/date-ticker.vue";
import { intFmt, weekdayDateFmt, xLabel } from "../utils/chart-formatters";

export interface TooltipRow {
  color: string;
  label: string;
  value: string | number;
}

interface ChartTooltipProps {
  showDatePill?: boolean;
  showCrosshair?: boolean;
  showDots?: boolean;
  /** Crosshair + dot color override. Default: var(--chart-crosshair) */
  indicatorColor?: string | ((point: Record<string, unknown>) => string);
  /** Dash pattern for the crosshair (renders a dashed line). */
  indicatorDasharray?: string;
  /** Vertical crosshair fade. Default: "both" */
  indicatorFadeEdges?: "both" | "top" | "bottom" | "none";
  /** Fade size as a percentage of height. Default: 10 */
  indicatorFadeLength?: number;
  /** Ring markers instead of filled dots. Default: "dot" */
  dotVariant?: "dot" | "ring";
  /** Dot radius multiplier. Default: 1 */
  dotScale?: number;
  /** Panel follows the crosshair spring when true. Default: false */
  matchCrosshair?: boolean;
  /** Custom row generator; defaults to one row per registered series. */
  rows?: (point: ChartDatum) => TooltipRow[];
}

const props = withDefaults(defineProps<ChartTooltipProps>(), {
  showDatePill: true,
  showCrosshair: true,
  showDots: true,
  indicatorColor: undefined,
  indicatorDasharray: undefined,
  indicatorFadeEdges: "both",
  indicatorFadeLength: 10,
  dotVariant: "dot",
  dotScale: 1,
  matchCrosshair: false,
  rows: undefined,
});

const {
  data,
  getYScale,
  innerHeight,
  margin,
  xAccessor,
  hover,
  containerRef,
  containerWidth,
  series,
  isSeriesHidden,
} = useChart();

const visibleSeries = computed(() =>
  series.filter((s) => !isSeriesHidden(s.dataKey))
);

const fadeStops = computed(() => {
  const f = props.indicatorFadeLength;
  const top = props.indicatorFadeEdges === "both" || props.indicatorFadeEdges === "top";
  const bottom =
    props.indicatorFadeEdges === "both" || props.indicatorFadeEdges === "bottom";
  return [
    { offset: "0%", opacity: top ? 0 : 1 },
    { offset: `${f}%`, opacity: 1 },
    { offset: `${100 - f}%`, opacity: 1 },
    { offset: "100%", opacity: bottom ? 0 : 1 },
  ];
});

const INDICATOR_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const BOX_SPRING = { type: "spring", stiffness: 100, damping: 20 } as const;

const datum = computed(() => (hover.active ? data.value[hover.index] : null));

// Upstream resolves indicatorColor against the hovered point; a function with no
// active point falls back to the crosshair var.
const resolvedIndicatorColor = computed(() => {
  const c = props.indicatorColor;
  if (c == null) {
    return "var(--chart-crosshair)";
  }
  if (typeof c === "function") {
    return datum.value ? c(datum.value) : "var(--chart-crosshair)";
  }
  return c;
});

const title = computed(() => {
  if (!datum.value) {
    return "";
  }
  const x = xAccessor(datum.value);
  return x instanceof Date ? weekdayDateFmt.format(x) : String(x);
});

const rows = computed<TooltipRow[]>(() => {
  const point = datum.value;
  if (!point) {
    return [];
  }
  if (props.rows) {
    return props.rows(point);
  }
  return visibleSeries.value.map((s) => ({
    color: s.color,
    label: s.dataKey,
    value: intFmt(Math.round(point[s.dataKey] as number)),
  }));
});

const dots = computed(() => {
  const point = datum.value;
  if (!point) {
    return [];
  }
  return visibleSeries.value.map((s) => ({
    key: s.dataKey,
    color: s.color,
    x: s.dotX ? s.dotX(point) : hover.x,
    y: s.dotY ? s.dotY(point) : getYScale(s.yAxisId)(point[s.dataKey] as number),
  }));
});

const dotRadius = computed(() => 5 * props.dotScale);

const tickerLabels = computed(() => data.value.map((d) => xLabel(xAccessor(d))));

const crosshairGradientId = `tooltip-indicator-${useId()}`;

const PANEL_OFFSET = 16;
const PANEL_WIDTH = 180;
const isFlipped = computed(
  () =>
    hover.x + margin.value.left + PANEL_WIDTH + PANEL_OFFSET >
    containerWidth.value
);
const panelX = computed(() => {
  const anchor = hover.x + margin.value.left;
  return isFlipped.value
    ? anchor - PANEL_OFFSET - PANEL_WIDTH
    : anchor + PANEL_OFFSET;
});
const panelTop = computed(() => margin.value.top);
const panelSpring = computed(() =>
  props.matchCrosshair ? INDICATOR_SPRING : BOX_SPRING
);

const pillX = computed(() => hover.x + margin.value.left);
</script>

<template>
  <g v-if="datum">
    <template v-if="showCrosshair">
      <motion.line
        v-if="indicatorDasharray"
        :stroke="resolvedIndicatorColor"
        :stroke-dasharray="indicatorDasharray"
        :stroke-width="1"
        :y1="0"
        :y2="innerHeight"
        :initial="{ x1: hover.x, x2: hover.x }"
        :animate="{ x1: hover.x, x2: hover.x }"
        :transition="INDICATOR_SPRING"
      />
      <template v-else>
        <defs>
          <linearGradient :id="crosshairGradientId" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop
              v-for="stop in fadeStops"
              :key="stop.offset"
              :offset="stop.offset"
              :stop-color="resolvedIndicatorColor"
              :stop-opacity="stop.opacity"
            />
          </linearGradient>
        </defs>
        <motion.rect
          :fill="`url(#${crosshairGradientId})`"
          :height="innerHeight"
          :width="1"
          :y="0"
          :initial="{ x: hover.x - 0.5 }"
          :animate="{ x: hover.x - 0.5 }"
          :transition="INDICATOR_SPRING"
        />
      </template>
    </template>

    <template v-if="showDots">
      <motion.circle
        v-for="dot in dots"
        :key="dot.key"
        :r="dotRadius"
        :fill="dotVariant === 'ring' ? 'transparent' : dot.color"
        :stroke="dotVariant === 'ring' ? dot.color : 'var(--chart-background)'"
        :stroke-width="dotVariant === 'ring' ? 1.5 : 2"
        :initial="{ cx: dot.x, cy: dot.y }"
        :animate="{ cx: dot.x, cy: dot.y }"
        :transition="INDICATOR_SPRING"
      />
    </template>
  </g>

  <foreignObject width="0" height="0">
    <Teleport v-if="containerRef" :to="containerRef">
      <AnimatePresence>
        <motion.div
          v-if="datum"
          class="tooltip-pos"
          :style="{ top: `${panelTop}px` }"
          :initial="{ opacity: 0, x: panelX }"
          :animate="{ opacity: 1, x: panelX }"
          :exit="{ opacity: 0 }"
          :transition="{ opacity: { duration: 0.1 }, x: panelSpring }"
        >
          <motion.div
            class="tooltip-panel"
            :style="{ transformOrigin: isFlipped ? 'right top' : 'left top' }"
            :initial="{ scale: 0.85, opacity: 0, x: isFlipped ? 20 : -20 }"
            :animate="{ scale: 1, opacity: 1, x: 0 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 25 }"
          >
            <div class="tooltip-inner">
              <div class="tooltip-title">{{ title }}</div>
              <div class="tooltip-rows">
                <div v-for="row in rows" :key="row.label" class="tooltip-row">
                  <div class="tooltip-row-label">
                    <span
                      class="tooltip-swatch"
                      :style="{ backgroundColor: row.color }"
                    />
                    <span class="tooltip-key">{{ row.label }}</span>
                  </div>
                  <span class="tooltip-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          v-if="showDatePill && datum"
          class="pill-pos"
          :initial="{ opacity: 0, x: pillX }"
          :animate="{ opacity: 1, x: pillX }"
          :exit="{ opacity: 0 }"
          :transition="{ opacity: { duration: 0.12 }, x: INDICATOR_SPRING }"
        >
          <div class="pill-center">
            <DateTicker :labels="tickerLabels" :current-index="hover.index" />
          </div>
        </motion.div>
      </AnimatePresence>
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.tooltip-pos {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 50;
  pointer-events: none;
}

.tooltip-panel {
  min-width: 140px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--chart-tooltip-background);
  color: var(--chart-tooltip-foreground);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.tooltip-inner {
  padding: 10px 12px;
}

.tooltip-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}

.tooltip-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tooltip-row-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-swatch {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 9999px;
}

.tooltip-key {
  color: var(--chart-tooltip-muted);
  font-size: 14px;
}

.tooltip-value {
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.pill-pos {
  position: absolute;
  left: 0;
  bottom: 4px;
  z-index: 50;
  pointer-events: none;
}

.pill-center {
  transform: translateX(-50%);
}
</style>
