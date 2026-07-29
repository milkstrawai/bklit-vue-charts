
/**
 * One stage's shape: a smooth trapezoid transitioning from the height of the
 * current norm to the next. Heights are `norm * H * 0.44 * layerScale` around
 * the midline; curved edges use a control point at 55% of the width.
 */
export function funnelSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  height: number,
  layerScale: number,
  straight = false
): string {
  const my = height / 2;
  const h0 = normStart * height * 0.44 * layerScale;
  const h1 = normEnd * height * 0.44 * layerScale;

  if (straight) {
    return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
  }

  const cx = segW * 0.55;
  const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
  const bottom = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
  return `${top} ${bottom} Z`;
}

/** Halo ring l of `layers`: outermost is full-size + faint, inner shrink + darken. */
export function funnelRingLayer(
  layerIndex: number,
  layers: number
): { scale: number; opacity: number } {
  return {
    scale: 1 - (layerIndex / layers) * 0.35,
    opacity: 0.18 + (layerIndex / (layers - 1 || 1)) * 0.65,
  };
}

/** Hovered ring scale: inner rings spring taller (up to +12%). */
export function funnelRingHoverScale(layerIndex: number, layers: number): number {
  return 1 + (layerIndex / Math.max(layers - 1, 1)) * 0.12;
}
