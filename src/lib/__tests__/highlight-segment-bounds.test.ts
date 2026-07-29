import { describe, expect, it } from "vitest";
import type { ChartDatum, XValue } from "../context";
import { computeSegmentBounds } from "../utils/highlight-segment-bounds";

// Points at x = 0,10,20,30; identity scale so pixels read directly.
const points: ChartDatum[] = [{ x: 0 }, { x: 10 }, { x: 20 }, { x: 30 }];
const scale = (v: XValue) => Number(v);
const xAccessor = (d: ChartDatum): XValue => d.x as unknown as XValue;

describe("computeSegmentBounds", () => {
  it("spans one point either side of the hovered index", () => {
    // index 1 → [x(0), x(2)] = [0, 20]
    expect(computeSegmentBounds(points, scale, xAccessor, 1)).toEqual({
      x: 0,
      width: 20,
    });
  });

  it("clamps at the left edge", () => {
    // index 0 → [x(0), x(1)] = [0, 10]
    expect(computeSegmentBounds(points, scale, xAccessor, 0)).toEqual({
      x: 0,
      width: 10,
    });
  });

  it("clamps at the right edge", () => {
    // index 3 → [x(2), x(3)] = [20, 30]
    expect(computeSegmentBounds(points, scale, xAccessor, 3)).toEqual({
      x: 20,
      width: 10,
    });
  });

  it("returns a zero band for empty data", () => {
    expect(computeSegmentBounds([], scale, xAccessor, 0)).toEqual({
      x: 0,
      width: 0,
    });
  });
});
