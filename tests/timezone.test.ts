import { describe, expect, it } from "vitest";
import { getEuropeMadridOffset, isDST, toEuropeMadrid, toUTC } from "../src/lib/timezone";

describe("timezone utilities", () => {
  it("returns CET offset in winter", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    expect(getEuropeMadridOffset(date)).toBe(60);
    expect(isDST(date)).toBe(false);
  });

  it("returns CEST offset in summer", () => {
    const date = new Date("2024-07-15T12:00:00Z");
    expect(getEuropeMadridOffset(date)).toBe(120);
    expect(isDST(date)).toBe(true);
  });

  it("formats Europe/Madrid display with offset", () => {
    const date = new Date("2024-01-15T09:15:00Z");
    const formatted = toEuropeMadrid(date);
    expect(formatted).toContain("2024-01-15");
    expect(formatted).toContain("10:15:00");
    expect(formatted).toContain("CET");
    expect(formatted).toContain("(+01:00)");
  });

  it("round-trips local time through UTC storage", () => {
    const localDate = new Date("2024-01-15T10:15:00+01:00");
    const stored = toUTC(localDate);
    const formatted = toEuropeMadrid(stored);
    expect(formatted).toContain("10:15:00");
    expect(formatted).toContain("CET");
  });

  it("handles invalid dates safely", () => {
    const invalid = new Date("invalid");
    expect(Number.isNaN(toUTC(invalid).getTime())).toBe(true);
    expect(toEuropeMadrid(invalid)).toBe("Invalid date");
  });
});
