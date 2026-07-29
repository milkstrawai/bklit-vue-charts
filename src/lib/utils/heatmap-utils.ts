export interface HeatmapBin {
  bin: number;
  count: number;
  date: Date;
}

export interface HeatmapColumn {
  bin: number;
  bins: HeatmapBin[];
}

export const HEATMAP_DAYS = 7;

/** Count → level 0–4. */
export function getHeatmapContributionLevel(count: number): number {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count === 2) {
    return 2;
  }
  if (count === 3) {
    return 3;
  }
  return 4;
}
