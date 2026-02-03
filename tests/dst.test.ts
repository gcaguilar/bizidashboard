import { describe, expect, it } from "vitest";
import {
  getDSTTransitions,
  isAmbiguousHour,
  isMissingHour,
  normalizeForStorage,
} from "../src/lib/dst";
import { getEuropeMadridOffset } from "../src/lib/timezone";

describe("DST transitions", () => {
  it("calculates correct transition dates for 2024", () => {
    const transitions = getDSTTransitions(2024);
    expect(transitions.spring.toISOString()).toBe("2024-03-31T01:00:00.000Z");
    expect(transitions.fall.toISOString()).toBe("2024-10-27T01:00:00.000Z");
  });

  it("calculates correct transition dates for 2025", () => {
    const transitions = getDSTTransitions(2025);
    expect(transitions.spring.toISOString()).toBe("2025-03-30T01:00:00.000Z");
    expect(transitions.fall.toISOString()).toBe("2025-10-26T01:00:00.000Z");
  });

  it("detects missing hour in spring transition", () => {
    const missingStart = new Date(Date.UTC(2024, 2, 31, 2, 0, 0));
    const missingMiddle = new Date(Date.UTC(2024, 2, 31, 2, 30, 0));
    const before = new Date(Date.UTC(2024, 2, 31, 1, 59, 0));
    const after = new Date(Date.UTC(2024, 2, 31, 3, 0, 0));

    expect(isMissingHour(missingStart)).toBe(true);
    expect(isMissingHour(missingMiddle)).toBe(true);
    expect(isMissingHour(before)).toBe(false);
    expect(isMissingHour(after)).toBe(false);
  });

  it("detects ambiguous hour in fall transition", () => {
    const ambiguousStart = new Date(Date.UTC(2024, 9, 27, 2, 0, 0));
    const ambiguousMiddle = new Date(Date.UTC(2024, 9, 27, 2, 30, 0));
    const before = new Date(Date.UTC(2024, 9, 27, 1, 59, 0));

    expect(isAmbiguousHour(ambiguousStart)).toBe(true);
    expect(isAmbiguousHour(ambiguousMiddle)).toBe(true);
    expect(isAmbiguousHour(before)).toBe(false);
  });

  it("tracks offsets around spring transition", () => {
    const before = new Date("2024-03-31T00:59:00Z");
    const after = new Date("2024-03-31T01:00:00Z");

    expect(getEuropeMadridOffset(before)).toBe(60);
    expect(getEuropeMadridOffset(after)).toBe(120);
  });

  it("tracks offsets around fall transition", () => {
    const before = new Date("2024-10-26T23:59:00Z");
    const firstOccurrence = new Date("2024-10-27T00:00:00Z");
    const secondOccurrence = new Date("2024-10-27T01:00:00Z");
    const after = new Date("2024-10-27T02:00:00Z");

    expect(getEuropeMadridOffset(before)).toBe(120);
    expect(getEuropeMadridOffset(firstOccurrence)).toBe(120);
    expect(getEuropeMadridOffset(secondOccurrence)).toBe(60);
    expect(getEuropeMadridOffset(after)).toBe(60);
  });

  it("normalizes missing hour to the first valid instant", () => {
    const missingLocal = new Date(Date.UTC(2024, 2, 31, 2, 30, 0));
    const normalized = normalizeForStorage(missingLocal);
    expect(normalized.toISOString()).toBe("2024-03-31T01:00:00.000Z");
  });

  it("normalizes ambiguous hour to the first occurrence", () => {
    const ambiguousLocal = new Date(Date.UTC(2024, 9, 27, 2, 30, 0));
    const normalized = normalizeForStorage(ambiguousLocal);
    expect(normalized.toISOString()).toBe("2024-10-27T00:30:00.000Z");
  });
});
