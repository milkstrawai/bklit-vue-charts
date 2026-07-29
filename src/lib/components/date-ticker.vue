<script setup lang="ts">
import { motion } from 'motion-v'
import { computed } from 'vue'

const props = defineProps<{
  labels: string[]
  currentIndex: number
}>()

const ITEM_HEIGHT = 24
const TICKER_SPRING = { type: 'spring', stiffness: 400, damping: 35 }
const COMPACT_TICKER_THRESHOLD = 60

const isCompact = computed(() => props.labels.length > COMPACT_TICKER_THRESHOLD)
const compactLabel = computed(() => props.labels[props.currentIndex] ?? props.labels[0] ?? '')

const parsedLabels = computed(() =>
  props.labels.map((label, index) => {
    const parts = String(label).split(' ')
    return {
      month: parts[0] || '',
      day: parts[1] || '',
      key: `${label}::${index}`
    }
  })
)

interface MonthSegment {
  month: string
  key: string
  startIndex: number
}

// One entry per consecutive month run (Jan → Feb → …)
const monthSegments = computed(() => {
  const segments: MonthSegment[] = []
  parsedLabels.value.forEach((label, index) => {
    const prev = segments.at(-1)
    if (!prev || prev.month !== label.month) {
      segments.push({
        month: label.month,
        key: `${label.month}-${index}`,
        startIndex: index
      })
    }
  })
  return segments
})

const currentMonthIndex = computed(() => {
  if (props.currentIndex < 0 || props.currentIndex >= parsedLabels.value.length) {
    return 0
  }
  for (let i = monthSegments.value.length - 1; i >= 0; i--) {
    if (monthSegments.value[i].startIndex <= props.currentIndex) {
      return i
    }
  }
  return 0
})

const dayY = computed(() => -props.currentIndex * ITEM_HEIGHT)
const monthY = computed(() => -currentMonthIndex.value * ITEM_HEIGHT)
</script>

<template>
  <div class="ticker">
    <div v-if="isCompact" class="ticker-window">
      <div class="ticker-item">{{ compactLabel }}</div>
    </div>
    <div v-else class="ticker-window">
      <div class="ticker-stacks">
        <div class="ticker-stack">
          <motion.div
            class="ticker-column"
            :initial="{ y: monthY }"
            :animate="{ y: monthY }"
            :transition="TICKER_SPRING"
          >
            <div v-for="segment in monthSegments" :key="segment.key" class="ticker-item">
              {{ segment.month }}
            </div>
          </motion.div>
        </div>
        <div v-if="parsedLabels.some((l) => l.day)" class="ticker-stack">
          <motion.div
            class="ticker-column"
            :initial="{ y: dayY }"
            :animate="{ y: dayY }"
            :transition="TICKER_SPRING"
          >
            <div v-for="label in parsedLabels" :key="label.key" class="ticker-item">
              {{ label.day }}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  overflow: hidden;
  border-radius: 9999px;
  background: var(--date-pill-background);
  color: var(--date-pill-foreground);
  padding: 4px 16px;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.ticker-window {
  position: relative;
  height: 24px;
  overflow: hidden;
}

.ticker-stacks {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.ticker-stack {
  position: relative;
  height: 24px;
  overflow: hidden;
}

.ticker-column {
  display: flex;
  flex-direction: column;
}

.ticker-item {
  display: flex;
  height: 24px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
}
</style>
