<script setup lang="ts">
import { computed } from 'vue'
import { resolvePatternPreset } from '../utils/pattern-preset'
import type { PatternPresetId, PatternPresetOptions } from '../utils/pattern-preset'

const props = defineProps<{
  id: string
  pattern: PatternPresetId
  options?: PatternPresetOptions
}>()

const tile = computed(() => resolvePatternPreset(props.pattern, props.options))
</script>

<template>
  <pattern
    v-if="tile"
    :id="id"
    patternUnits="userSpaceOnUse"
    :width="tile.width"
    :height="tile.height"
  >
    <rect
      v-if="tile.background"
      :width="tile.width"
      :height="tile.height"
      :fill="tile.background"
    />

    <circle
      v-if="tile.circle"
      :cx="tile.width / 2"
      :cy="tile.height / 2"
      :r="tile.circle.radius"
      :fill="tile.circle.fill"
      :stroke="tile.circle.stroke"
      :stroke-width="tile.circle.strokeWidth"
    />

    <path
      v-if="tile.lines"
      :d="tile.lines.d"
      :stroke="tile.lines.stroke"
      :stroke-width="tile.lines.strokeWidth"
      fill="none"
    />
  </pattern>
</template>
