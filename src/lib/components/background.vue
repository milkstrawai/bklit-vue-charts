<script setup lang="ts">
import { motion } from 'motion-v'
import { computed, useId } from 'vue'
import { useChart } from '../composables/use-chart'
import PatternPreset from './pattern-preset.vue'
import type { PatternPresetId } from '../utils/pattern-preset'

interface BackgroundProps {
  /** Pattern preset. "none" renders nothing. Default: "diagonal" */
  pattern?: PatternPresetId
  /** Pattern stroke/fill color. Default: var(--chart-grid) */
  color?: string
  /** Fill opacity. Default: 1 */
  opacity?: number
  /** Texture scale — multiplies the per-preset tile size. Default: 1 */
  scale?: number
  /** Stroke width for line patterns. Defaults to the per-preset base × `scale`. */
  strokeWidth?: number
}

const props = withDefaults(defineProps<BackgroundProps>(), {
  pattern: 'diagonal',
  color: 'var(--chart-grid)',
  opacity: 1,
  scale: 1,
  strokeWidth: undefined
})

const { innerWidth, innerHeight, animationDurationMs } = useChart()

const patternOptions = computed(() => ({
  color: props.color,
  scale: props.scale,
  strokeWidth: props.strokeWidth
}))

const patternId = `chart-bg-${useId().replace(/:/g, '')}`
const revealDelay = computed(() => animationDurationMs.value / 1000)
</script>

<template>
  <g v-if="pattern !== 'none'">
    <defs>
      <PatternPreset :id="patternId" :pattern="pattern" :options="patternOptions" />
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
