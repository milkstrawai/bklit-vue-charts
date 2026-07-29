<script setup lang="ts">
import { computed } from "vue";
import { useChart } from "../composables/use-chart";
import type { XScale } from "../context";
import { xLabel } from "../utils/chart-formatters";

interface ChartXAxisProps {
  numTicks?: number;
  tickerHalfWidth?: number;
  /** "data" snaps labels to rows (crosshair-aligned); "domain" spaces evenly. */
  tickMode?: "data" | "domain";
  /** Max labels for band (category) axes. Default: 12 */
}

const props = withDefaults(defineProps<ChartXAxisProps>(), {
  numTicks: 5,
  tickerHalfWidth: 50,
  tickMode: "data",
});

const { data, xScale, xAccessor, hover, margin, containerRef } =
  useChart();

interface AxisTick {
  key: string | number;
  x: number;
  label: string;
}

function categoryTicks(scale: XScale): AxisTick[] {
  const rows = data.value;
  const stride = Math.max(1, Math.ceil(rows.length / props.numTicks));
  const ticks: AxisTick[] = [];
  rows.forEach((d, i) => {
    if (i % stride !== 0) {
      return;
    }
    const x = xAccessor(d);
    ticks.push({
      key: String(x),
      x: scale(x) + (scale.bandwidth?.() ?? 0) / 2,
      label: xLabel(x),
    });
  });
  return ticks;
}

function dataTicks(scale: XScale): AxisTick[] {
  const pointCount = data.value.length;
  const tickCount = Math.min(Math.max(2, props.numTicks), pointCount);
  const step = (pointCount - 1) / (tickCount - 1);
  const ticks: AxisTick[] = [];
  for (let i = 0; i < tickCount; i++) {
    const x = xAccessor(data.value[Math.round(i * step)]);
    ticks.push({
      key: x instanceof Date ? x.getTime() : String(x),
      x: scale(x),
      label: xLabel(x),
    });
  }
  return ticks;
}

function domainTicks(scale: XScale): AxisTick[] {
  const s = scale as unknown as { ticks?: (n: number) => Date[] };
  const raw = s.ticks?.(props.numTicks) ?? [];
  return raw.map((x) => ({ key: x.getTime(), x: scale(x), label: xLabel(x) }));
}

const ticks = computed(() => {
  if (data.value.length === 0) {
    return [];
  }
  const scale = xScale.value;
  if (typeof scale.bandwidth === "function") {
    return categoryTicks(scale);
  }
  return props.tickMode === "domain" ? domainTicks(scale) : dataTicks(scale);
});

const hoveredLabel = computed(() => {
  if (!hover.active) {
    return null;
  }
  const point = data.value[hover.index];
  return point ? xLabel(xAccessor(point)) : null;
});

const FADE_BUFFER = 20;
function labelOpacity(tick: AxisTick): number {
  if (!hover.active) {
    return 1;
  }
  if (tick.label === hoveredLabel.value) {
    return 0;
  }
  const distance = Math.abs(tick.x - hover.x);
  if (distance < props.tickerHalfWidth) {
    return 0;
  }
  if (distance < props.tickerHalfWidth + FADE_BUFFER) {
    return (distance - props.tickerHalfWidth) / FADE_BUFFER;
  }
  return 1;
}
</script>

<template>
  <foreignObject width="0" height="0">
    <Teleport v-if="containerRef" :to="containerRef">
      <div class="x-axis" aria-hidden="true">
        <div
          v-for="tick in ticks"
          :key="tick.key"
          class="x-axis-tick"
          :style="{ left: `${tick.x + margin.left}px` }"
        >
          <span class="x-axis-label" :style="{ opacity: labelOpacity(tick) }">
            {{ tick.label }}
          </span>
        </div>
      </div>
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.x-axis {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.x-axis-tick {
  position: absolute;
  bottom: 12px;
  width: 0;
  display: flex;
  justify-content: center;
}

.x-axis-label {
  white-space: nowrap;
  font-size: 12px;
  color: var(--chart-label);
  font-variant-numeric: tabular-nums;
  transition: opacity 0.4s ease-in-out;
}
</style>
