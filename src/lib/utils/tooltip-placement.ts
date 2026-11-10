// Horizontal placement of a tooltip panel beside the crosshair. The panel prefers
// the right side and flips left when only the left side fits. When neither side
// fits, it takes the side with more room. The result is then pulled back inside
// the container, so the panel overlaps the crosshair instead of being cropped by
// the container edge. A panel wider than the container minus both paddings is
// pinned to the left padding.

export interface TooltipXPlacementInput {
  /** Crosshair x, in container pixels. */
  anchor: number
  /** Panel width in pixels. */
  width: number
  /** Width of the box the panel must stay inside. */
  containerWidth: number
  /** Gap between the crosshair and the panel. */
  offset: number
  /** Minimum gap between the panel and the container edges. */
  padding: number
}

export interface TooltipXPlacement {
  /** Panel left edge, in container pixels. */
  x: number
  /** True when the panel sits left of the crosshair. */
  flipped: boolean
}

export function placeTooltipX({
  anchor,
  width,
  containerWidth,
  offset,
  padding
}: TooltipXPlacementInput): TooltipXPlacement {
  const rightX = anchor + offset
  const leftX = anchor - offset - width
  const fitsRight = rightX + width <= containerWidth - padding
  const fitsLeft = leftX >= padding
  const flipped = !fitsRight && (fitsLeft || anchor > containerWidth / 2)
  const maxX = Math.max(padding, containerWidth - padding - width)
  return { x: Math.min(Math.max(flipped ? leftX : rightX, padding), maxX), flipped }
}
