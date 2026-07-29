import { describe, expect, it } from "vitest";
import type { XValue } from "../context";
import { computeReferenceAreaRect } from "../utils/reference-area-geometry";

const innerWidth = 400;
const innerHeight = 200;

const xScale = (value: XValue) => (value as Date).getTime() / 10;
const yScale = (value: number) => innerHeight - value;

function baseOptions(
  overrides: Partial<Parameters<typeof computeReferenceAreaRect>[0]> = {}
) {
  return { innerWidth, innerHeight, xScale, yScale, ...overrides };
}

describe("computeReferenceAreaRect", () => {
  it("maps a full-width horizontal band between y1 and y2", () => {
    expect(computeReferenceAreaRect(baseOptions({ y1: 40, y2: 80 }))).toEqual({
      x: 0,
      y: 120,
      width: 400,
      height: 40,
    });
  });

  it("maps a partial x-range when x1 and x2 are set", () => {
    expect(
      computeReferenceAreaRect(
        baseOptions({
          x1: new Date(1000),
          x2: new Date(2000),
          y1: 50,
          y2: 100,
        })
      )
    ).toEqual({ x: 100, y: 100, width: 100, height: 50 });
  });

  it("clamps to the plot when ifOverflow is hidden", () => {
    expect(
      computeReferenceAreaRect(
        baseOptions({ y1: 150, y2: 250, ifOverflow: "hidden" })
      )
    ).toEqual({ x: 0, y: 0, width: 400, height: 50 });
  });

  it("returns null when discard and partly outside the plot", () => {
    expect(
      computeReferenceAreaRect(
        baseOptions({ y1: 150, y2: 250, ifOverflow: "discard" })
      )
    ).toBeNull();
  });

  it("does not clamp when ifOverflow is visible", () => {
    expect(
      computeReferenceAreaRect(
        baseOptions({ y1: 150, y2: 250, ifOverflow: "visible" })
      )
    ).toEqual({ x: 0, y: -50, width: 400, height: 100 });
  });

  it("returns null for zero plot size", () => {
    expect(
      computeReferenceAreaRect(
        baseOptions({ innerWidth: 0, innerHeight: 200, y1: 10, y2: 20 })
      )
    ).toBeNull();
  });
});
