export interface HeatmapBin {
  bin: number
  count: number
  date: Date
}

export interface HeatmapColumn {
  bin: number
  bins: HeatmapBin[]
}

/** Count → level 0–4. */
export function getHeatmapContributionLevel(count: number): number {
  return Math.min(Math.max(0, Math.trunc(count)), 4)
}
