<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { motion } from 'motion-v'
import { computed, ref, shallowRef } from 'vue'
import { intFmt } from '../utils/chart-formatters'
import { funnelRingHoverScale, funnelRingLayer, funnelSegmentPath } from '../utils/funnel-geometry'

export interface FunnelGradientStop {
  offset: number | string
  color: string
}

export interface FunnelStage {
  label: string
  value: number
  displayValue?: string
  /** Solid color for this stage (overrides the chart `color`). */
  color?: string
  /** Left→right gradient for this stage (overrides `color`). */
  gradient?: FunnelGradientStop[]
}

interface FunnelChartProps {
  data: FunnelStage[]
  color?: string
  /** Number of concentric halo rings per segment. Default: 3 */
  layers?: number
  /** Gap between segments in pixels. Default: 4 */
  gap?: number
  /** Stagger delay between segment animations (seconds). Default: 0.12 */
  staggerDelay?: number
  edges?: 'curved' | 'straight'
  showPercentage?: boolean
  showValues?: boolean
  showLabels?: boolean
  formatPercentage?: (pct: number) => string
  formatValue?: (value: number) => string
}

const props = withDefaults(defineProps<FunnelChartProps>(), {
  color: 'var(--chart-1)',
  layers: 3,
  gap: 4,
  staggerDelay: 0.12,
  edges: 'curved',
  showPercentage: true,
  showValues: true,
  showLabels: true,
  formatPercentage: (pct: number) => `${Math.round(pct)}%`,
  formatValue: intFmt
})

const containerRef = ref<HTMLDivElement | null>(null)
const { width, height } = useElementSize(containerRef)
const hoveredIndex = shallowRef<number | null>(null)

const stageCount = computed(() => props.data.length)
const segmentWidth = computed(() =>
  stageCount.value > 0 ? (width.value - props.gap * (stageCount.value - 1)) / stageCount.value : 0
)
const norms = computed(() => {
  const max = props.data[0]?.value ?? 1
  return props.data.map((stage) => stage.value / max)
})

function segmentPath(normStart: number, normEnd: number, layerScale: number): string {
  return funnelSegmentPath(
    normStart,
    normEnd,
    segmentWidth.value,
    height.value,
    layerScale,
    props.edges === 'straight'
  )
}

interface SegmentRing {
  d: string
  opacity: number
}

const segments = computed(() => {
  const n = stageCount.value
  return props.data.map((stage, i) => {
    const normStart = norms.value[i] ?? 0
    const normEnd = norms.value[Math.min(i + 1, n - 1)] ?? 0
    const rings: SegmentRing[] = Array.from({ length: props.layers }, (_, l) => {
      const layer = funnelRingLayer(l, props.layers)
      return {
        d: segmentPath(normStart, normEnd, layer.scale),
        opacity: layer.opacity
      }
    })
    const firstStop = stage.gradient?.[0]
    return {
      stage,
      rings,
      color: firstStop ? firstStop.color : (stage.color ?? props.color),
      gradient: stage.gradient,
      gradientId: `funnel-grad-${i}`,
      pct: (stage.value / (props.data[0]?.value ?? 1)) * 100,
      display: stage.displayValue ?? props.formatValue(stage.value)
    }
  })
})

function stopOffset(offset: number | string): string {
  return typeof offset === 'number' ? `${offset * 100}%` : offset
}

function ringHoverTransition(ringIndex: number) {
  return {
    type: 'spring',
    stiffness: 300 - ringIndex * 60,
    damping: 24 - ringIndex * 3
  } as const
}

function ringHoverScale(ringIndex: number): number {
  return funnelRingHoverScale(ringIndex, props.layers)
}

const ENTER_TRANSITION = {
  type: 'tween',
  duration: 1.1,
  ease: [0.85, 0, 0.15, 1]
} as const
</script>

<template>
  <div ref="containerRef" class="funnel" @pointerleave="hoveredIndex = null">
    <template v-if="width > 0 && height > 0">
      <div class="funnel-segments" :style="{ gap: `${gap}px` }">
        <motion.div
          v-for="(segment, i) in segments"
          :key="segment.stage.label"
          class="funnel-segment"
          :style="{
            width: `${segmentWidth}px`,
            zIndex: hoveredIndex === i ? 10 : 1
          }"
          :animate="{
            opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1
          }"
          :transition="{ opacity: { duration: 0.15 } }"
          @pointerenter="hoveredIndex = i"
        >
          <motion.div
            class="funnel-segment-shape"
            :initial="{ scaleX: 0, scaleY: 0 }"
            :animate="{ scaleX: 1, scaleY: 1 }"
            :transition="{ ...ENTER_TRANSITION, delay: i * staggerDelay }"
          >
            <svg
              aria-hidden="true"
              class="funnel-svg"
              preserveAspectRatio="none"
              :viewBox="`0 0 ${segmentWidth} ${height}`"
            >
              <defs v-if="segment.gradient">
                <linearGradient :id="segment.gradientId" x1="0" x2="1" y1="0" y2="0">
                  <stop
                    v-for="stop in segment.gradient"
                    :key="`${stop.offset}-${stop.color}`"
                    :offset="stopOffset(stop.offset)"
                    :stop-color="stop.color"
                  />
                </linearGradient>
              </defs>
              <motion.path
                v-for="(ring, l) in segment.rings"
                :key="l"
                :d="ring.d"
                :fill="
                  segment.gradient && l === segment.rings.length - 1
                    ? `url(#${segment.gradientId})`
                    : segment.color
                "
                :opacity="ring.opacity"
                :style="{ transformOrigin: 'center center' }"
                :animate="{
                  scaleY: hoveredIndex === i ? ringHoverScale(l) : 1
                }"
                :transition="ringHoverTransition(l)"
              />
            </svg>
          </motion.div>

          <motion.div
            class="funnel-labels"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{
              delay: i * staggerDelay + 0.25,
              duration: 0.35,
              ease: 'easeOut'
            }"
          >
            <div v-if="showValues" class="funnel-value-slot">
              <span class="funnel-value">{{ segment.display }}</span>
            </div>
            <div class="funnel-pct-slot">
              <span v-if="showPercentage" class="funnel-pct">
                {{ formatPercentage(segment.pct) }}
              </span>
            </div>
            <div v-if="showLabels" class="funnel-label-slot">
              <span class="funnel-label">{{ segment.stage.label }}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.funnel {
  position: relative;
  width: 100%;
  aspect-ratio: 2.2 / 1;
  user-select: none;
  overflow: visible;
}

.funnel-segments {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row;
  overflow: visible;
}

.funnel-segment {
  position: relative;
  flex-shrink: 0;
  height: 100%;
  overflow: visible;
}

.funnel-segment-shape {
  position: absolute;
  inset: 0;
  overflow: visible;
  transform-origin: left center;
}

.funnel-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.funnel-labels {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.funnel-value-slot {
  display: flex;
  height: 16%;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
}

.funnel-value {
  white-space: nowrap;
  font-weight: 600;
  font-size: 14px;
  color: var(--foreground);
}

.funnel-pct-slot {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.funnel-pct {
  border-radius: 9999px;
  background: var(--foreground);
  color: var(--background);
  padding: 4px 12px;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.funnel-label-slot {
  display: flex;
  height: 16%;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
}

.funnel-label {
  white-space: nowrap;
  font-weight: 500;
  font-size: 12px;
  color: var(--muted-foreground);
}
</style>
