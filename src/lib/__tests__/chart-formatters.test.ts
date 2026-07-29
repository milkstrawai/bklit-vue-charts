import { describe, expect, it } from "vitest";
import {
  intFmt,
  shortDateFmt,
  weekdayDateFmt,
  xLabel,
} from "../utils/chart-formatters";

const sampleDates = [
  new Date(2025, 0, 5, 9, 8, 7),
  new Date(2024, 11, 31, 23, 59, 59),
  new Date(2026, 6, 4, 12, 0, 0),
];

const sampleNumbers = [0, 42, 1234, 1_234_567, -9876.5];

describe("shortDateFmt", () => {
  for (const date of sampleDates) {
    it(`matches toLocaleDateString for ${date.toISOString()}`, () => {
      expect(shortDateFmt.format(date)).toBe(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    });
  }
});

describe("weekdayDateFmt", () => {
  for (const date of sampleDates) {
    it(`matches toLocaleDateString for ${date.toISOString()}`, () => {
      expect(weekdayDateFmt.format(date)).toBe(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    });
  }
});

describe("intFmt", () => {
  for (const value of sampleNumbers) {
    it(`matches toLocaleString for ${value}`, () => {
      expect(intFmt(value)).toBe(value.toLocaleString("en-US"));
    });
  }

  it("is a reusable formatter function", () => {
    const formatValue = intFmt;
    expect(formatValue(1000)).toBe((1000).toLocaleString("en-US"));
  });
});

describe("xLabel", () => {
  it("formats a Date as short month + day", () => {
    expect(xLabel(new Date(2026, 5, 25))).toBe("Jun 25");
  });

  it("passes category strings through unchanged", () => {
    expect(xLabel("Jan")).toBe("Jan");
  });

  it("stringifies non-date, non-string values", () => {
    expect(xLabel(42)).toBe("42");
  });
});
