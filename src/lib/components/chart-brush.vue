<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { computed } from "vue";
import { ref } from "vue";
import { useChart } from "../composables/use-chart";

export interface ChartBrushSelection {
  start: Date;
  end: Date;
}

interface ChartBrushProps {
  /** Selected window (v-model); null = full extent. */
  modelValue?: ChartBrushSelection | null;
  /** Drag axis. Only "horizontal" (time) is drawn. Default: "horizontal" */
  brushDirection?: "horizontal" | "vertical" | "both";
  /** Backdrop blur (px) on the dimmed out-of-selection track. Default: 1.5 */
  blurPx?: number;
  /** Mask-fade the dimmed panes at the outer edges. Default: true */
  fadeOuterEdges?: boolean;
  /** Initial window when modelValue is null. */
  initialSelection?: ChartBrushSelection | null;
}

const props = withDefaults(defineProps<ChartBrushProps>(), {
  modelValue: null,
  brushDirection: "horizontal",
  blurPx: 1.5,
  fadeOuterEdges: true,
  initialSelection: null,
});

const emit = defineEmits<{
  "update:modelValue": [selection: ChartBrushSelection | null];
}>();

const { xScale, innerWidth, innerHeight, margin, containerRef } = useChart();

const MIN_PX = 12;
const clampPx = (v: number): number =>
  Math.max(0, Math.min(innerWidth.value, v));
const toDate = (px: number): Date =>
  (xScale.value.invert?.(px) as Date) ?? new Date();

const domain = computed(
  () => (xScale.value.domain?.() ?? [new Date(0), new Date(1)]) as [Date, Date]
);
const selection = computed<ChartBrushSelection>(
  () =>
    props.modelValue ??
    props.initialSelection ?? { start: domain.value[0], end: domain.value[1] }
);

const startX = computed(() => clampPx(xScale.value(selection.value.start)));
const endX = computed(() => clampPx(xScale.value(selection.value.end)));

type DragMode = "move" | "left" | "right";
const dragMode = ref<DragMode | null>(null);
let anchorClientX = 0;
let startAtDrag = 0;
let endAtDrag = 0;

function beginDrag(mode: DragMode, event: PointerEvent): void {
  dragMode.value = mode;
  anchorClientX = event.clientX;
  startAtDrag = startX.value;
  endAtDrag = endX.value;
  event.preventDefault();
}

useEventListener(window, "pointermove", (event: PointerEvent) => {
  if (!dragMode.value) {
    return;
  }
  const dx = event.clientX - anchorClientX;
  let ns = startAtDrag;
  let ne = endAtDrag;
  if (dragMode.value === "move") {
    const span = endAtDrag - startAtDrag;
    ns = clampPx(startAtDrag + dx);
    if (ns + span > innerWidth.value) {
      ns = innerWidth.value - span;
    }
    ne = ns + span;
  } else if (dragMode.value === "left") {
    ns = clampPx(Math.min(startAtDrag + dx, endAtDrag - MIN_PX));
  } else {
    ne = clampPx(Math.max(endAtDrag + dx, startAtDrag + MIN_PX));
  }
  emit("update:modelValue", { start: toDate(ns), end: toDate(ne) });
});
useEventListener(window, "pointerup", () => {
  dragMode.value = null;
});

const plotLeft = computed(() => margin.value.left);
const plotTop = computed(() => margin.value.top);

const leftDimStyle = computed(() => ({
  left: `${plotLeft.value}px`,
  top: `${plotTop.value}px`,
  width: `${startX.value}px`,
  height: `${innerHeight.value}px`,
  backdropFilter: `blur(${props.blurPx}px)`,
  WebkitBackdropFilter: `blur(${props.blurPx}px)`,
  maskImage: props.fadeOuterEdges
    ? "linear-gradient(to left, #000 85%, transparent)"
    : undefined,
}));
const rightDimStyle = computed(() => ({
  left: `${plotLeft.value + endX.value}px`,
  top: `${plotTop.value}px`,
  width: `${Math.max(0, innerWidth.value - endX.value)}px`,
  height: `${innerHeight.value}px`,
  backdropFilter: `blur(${props.blurPx}px)`,
  WebkitBackdropFilter: `blur(${props.blurPx}px)`,
  maskImage: props.fadeOuterEdges
    ? "linear-gradient(to right, #000 85%, transparent)"
    : undefined,
}));
const windowStyle = computed(() => ({
  left: `${plotLeft.value + startX.value}px`,
  top: `${plotTop.value}px`,
  width: `${Math.max(0, endX.value - startX.value)}px`,
  height: `${innerHeight.value}px`,
}));
const leftHandleStyle = computed(() => ({
  left: `${plotLeft.value + startX.value}px`,
  top: `${plotTop.value}px`,
  height: `${innerHeight.value}px`,
}));
const rightHandleStyle = computed(() => ({
  left: `${plotLeft.value + endX.value}px`,
  top: `${plotTop.value}px`,
  height: `${innerHeight.value}px`,
}));
</script>

<template>
  <foreignObject width="0" height="0">
    <Teleport v-if="containerRef" :to="containerRef">
      <div class="brush-layer">
        <div class="brush-dim" :style="leftDimStyle" />
        <div class="brush-dim" :style="rightDimStyle" />
        <div
          class="brush-window"
          :style="windowStyle"
          @pointerdown="beginDrag('move', $event)"
        />
        <div
          class="brush-handle"
          :style="leftHandleStyle"
          @pointerdown="beginDrag('left', $event)"
        >
          <span class="brush-grip" />
        </div>
        <div
          class="brush-handle"
          :style="rightHandleStyle"
          @pointerdown="beginDrag('right', $event)"
        >
          <span class="brush-grip" />
        </div>
      </div>
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.brush-layer {
  position: absolute;
  inset: 0;
  user-select: none;
  -webkit-user-select: none;
}

.brush-dim {
  position: absolute;
  background: color-mix(in oklch, var(--chart-background) 55%, transparent);
  pointer-events: none;
}

.brush-window {
  position: absolute;
  background: color-mix(in oklch, var(--chart-crosshair) 6%, transparent);
  cursor: grab;
  pointer-events: auto;
}
.brush-window:active {
  cursor: grabbing;
}

.brush-handle {
  position: absolute;
  width: 12px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  pointer-events: auto;
}

.brush-grip {
  width: 4px;
  height: 24px;
  border-radius: 9999px;
  background: var(--chart-brush-border, var(--chart-crosshair));
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}
</style>
