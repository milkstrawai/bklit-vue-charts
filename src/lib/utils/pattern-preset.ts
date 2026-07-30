export const PATTERN_PRESET_IDS = [
  'none',
  'diagonal',
  'horizontal',
  'vertical',
  'cross',
  'dots',
  'circles',
  'accent'
] as const

export type PatternPresetId = (typeof PATTERN_PRESET_IDS)[number]

export interface PatternPresetOptions {
  color?: string
  scale?: number
  strokeWidth?: number
  radius?: number
  complement?: boolean
  fill?: string
  dotFill?: boolean
  tileBackground?: string
}

export const ACCENT_PATTERN_COLOR = '#e879f9'

export function isCirclePattern(preset: PatternPresetId): boolean {
  return preset === 'circles' || preset === 'dots'
}

export function patternPresetTileSize(
  preset: PatternPresetId,
  scale = 1
): { width: number; height: number; strokeWidth: number } {
  let base = { width: 6, height: 6, strokeWidth: 1 }
  if (preset === 'dots') {
    base = { width: 10, height: 10, strokeWidth: 0 }
  } else if (preset === 'cross') {
    base = { width: 8, height: 8, strokeWidth: 1 }
  }

  return {
    width: base.width * scale,
    height: base.height * scale,
    strokeWidth: base.strokeWidth * scale
  }
}

export interface ResolvedPatternPreset {
  width: number
  height: number
  background?: string
  circle?: { radius: number; fill: string; stroke: string; strokeWidth: number }
  lines?: { d: string; stroke: string; strokeWidth: number }
}

export function resolvePatternPreset(
  preset: PatternPresetId,
  options: PatternPresetOptions = {}
): ResolvedPatternPreset | null {
  if (preset === 'none') {
    return null
  }

  const color = options.color ?? 'var(--chart-1)'
  const scale = options.scale ?? 1
  const tile = patternPresetTileSize(preset, scale)
  const background = options.tileBackground
  const { width, height } = tile

  if (isCirclePattern(preset)) {
    const isDotGrid = preset === 'dots'
    const radius = options.radius ?? (isDotGrid ? Math.max(0.5, 1.5 * scale) : 2 * scale)
    const dotFillEnabled = options.dotFill !== false

    if (isDotGrid) {
      return {
        width,
        height,
        background,
        circle: {
          radius,
          fill: dotFillEnabled ? options.fill || color : 'none',
          stroke: dotFillEnabled && options.fill ? 'none' : color,
          strokeWidth:
            dotFillEnabled && !options.fill
              ? (options.strokeWidth ?? 0)
              : (options.strokeWidth ?? 1)
        }
      }
    }

    return {
      width,
      height,
      background,
      circle: {
        radius,
        fill: options.fill || 'none',
        stroke: color,
        strokeWidth: options.strokeWidth ?? tile.strokeWidth
      }
    }
  }

  const strokeWidth = options.strokeWidth ?? tile.strokeWidth
  const diagonal = `M 0 ${height} L ${width} 0`

  const geometry: Record<string, { d: string; stroke: string }> = {
    diagonal: { d: diagonal, stroke: color },
    horizontal: { d: `M 0 ${height / 2} L ${width} ${height / 2}`, stroke: color },
    vertical: { d: `M ${width / 2} 0 L ${width / 2} ${height}`, stroke: color },
    cross: { d: `M 0 0 L ${width} ${height} M ${width} 0 L 0 ${height}`, stroke: color },
    accent: { d: diagonal, stroke: ACCENT_PATTERN_COLOR }
  }

  const lines = geometry[preset]
  return lines ? { width, height, background, lines: { ...lines, strokeWidth } } : null
}
