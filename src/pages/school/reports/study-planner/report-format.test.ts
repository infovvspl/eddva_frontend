import { describe, expect, it } from "vitest";
import { bucketLabel, classLabel, formatDay, formatDuration, formatImprovement } from "./report-format";

describe("report formatting", () => {
  it("formats study time", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(300)).toBe("5m");
    expect(formatDuration(7500)).toBe("2h 05m");
  });

  it("rolls over into days once the total reaches 24h", () => {
    expect(formatDuration(86400)).toBe("1d 00h 00m"); // exactly 24h
    expect(formatDuration(2109960)).toBe("24d 10h 06m"); // 586h 06m
  });

  it("formats improvement, saying when it has not been measured", () => {
    expect(formatImprovement(12.54)).toBe("+12.5 pts");
    expect(formatImprovement(-3)).toBe("−3 pts");
    expect(formatImprovement(0)).toBe("0 pts");
    expect(formatImprovement(null)).toBe("Not measured yet");
  });

  it("labels trend buckets by granularity", () => {
    expect(bucketLabel("2026-10-24", "day")).toBe("24 Oct");
    expect(bucketLabel("2026-10-19", "week")).toBe("19 Oct");
    expect(bucketLabel("2026-10-01", "month")).toBe("Oct 2026");
    expect(bucketLabel("2026-01-01", "year")).toBe("2026");
  });

  it("formats days and class labels", () => {
    expect(formatDay("2026-10-24")).toBe("24 Oct 2026");
    expect(formatDay(null)).toBe("Never");
    expect(classLabel({ className: "Class 10", sectionName: "A" })).toBe("Class 10 · A");
    expect(classLabel({ className: null, sectionName: null })).toBe("—");
  });
});
