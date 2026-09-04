import { describe, expect, it } from "vitest";
import { formatPreferredDateTime, getTimeSlots, preferredDateTimeError } from "@/lib/preferred-time";

describe("preferred datetime slots", () => {
  it("rounds now plus 30 minutes up to a 15-minute slot", () => {
    const now = Date.parse("2026-09-04T14:51:00+05:30");
    expect(getTimeSlots(now).slice(0, 4)).toEqual([
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:15:00.000Z", "2026-09-04T10:30:00.000Z", "2026-09-04T10:45:00.000Z",
    ]);
  });
  it("keeps next-day slots valid across midnight", () => {
    const now = Date.parse("2026-09-04T23:00:00+05:30");
    const slots = getTimeSlots(now);
    expect(slots.slice(0, 4)).toEqual(["2026-09-04T18:00:00.000Z", "2026-09-04T18:15:00.000Z", "2026-09-04T18:30:00.000Z", "2026-09-04T18:45:00.000Z"]);
    expect(preferredDateTimeError("2026-09-04T19:30:00.000Z", now)).toBeUndefined();
    expect(formatPreferredDateTime("2026-09-04T19:30:00.000Z", now)).toMatch(/^Tomorrow, 1:00 am$/i);
  });
  it("enforces the minimum and four-hour maximum", () => {
    const now = Date.parse("2026-09-04T23:00:00+05:30");
    expect(preferredDateTimeError("2026-09-04T17:59:00.000Z", now)).toContain("at least 30 minutes");
    expect(preferredDateTimeError("2026-09-04T21:30:00.000Z", now)).toBeUndefined();
    expect(preferredDateTimeError("2026-09-04T21:45:00.000Z", now)).toContain("within the next 4 hours");
  });
});
