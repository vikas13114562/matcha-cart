import { describe, expect, it } from "vitest";
import { closedCartMessage, formatOpeningTime, fromIndiaDateTimeInput, resolveCartStatus, toIndiaDateTimeInput } from "@/lib/cart-status";

const opening = "2099-09-03T07:30:00.000Z";

describe("cart opening schedule", () => {
  it("preserves existing open and manually closed settings", () => {
    expect(resolveCartStatus(null)).toEqual({ ordersEnabled: true, reopensAt: null });
    expect(resolveCartStatus({ value: false })).toEqual({ ordersEnabled: false, reopensAt: null });
  });
  it("stays closed before the schedule and opens at the exact scheduled time", () => {
    const setting = { value: false, reopensAt: opening };
    expect(resolveCartStatus(setting, Date.parse(opening) - 1)).toEqual({ ordersEnabled: false, reopensAt: opening });
    expect(resolveCartStatus(setting, Date.parse(opening))).toEqual({ ordersEnabled: true, reopensAt: null });
    expect(resolveCartStatus(setting, Date.parse(opening) + 60_000).ordersEnabled).toBe(true);
  });
  it("does not open for a malformed stored date", () => {
    expect(resolveCartStatus({ value: false, reopensAt: "invalid" })).toEqual({ ordersEnabled: false, reopensAt: null });
  });
  it("converts India time independently of the browser/server timezone", () => {
    expect(fromIndiaDateTimeInput("2099-09-03T13:00")).toBe(opening);
    expect(toIndiaDateTimeInput(opening)).toBe("2099-09-03T13:00");
    expect(toIndiaDateTimeInput(null)).toBe("");
    expect(formatOpeningTime("2026-09-03T07:56:00.000Z")).toBe("Thursday, 3 September 2026 at 1:26 PM IST");
    expect(formatOpeningTime("2026-09-03T20:00:00.000Z")).toBe("Friday, 4 September 2026 at 1:30 AM IST");
  });
  it("shows a sorry message with the scheduled date and India time", () => {
    expect(closedCartMessage(opening)).toContain("Sorry, the cart is currently closed.");
    expect(closedCartMessage(opening)).toContain("2099");
    expect(closedCartMessage(opening)).toContain("IST");
    expect(closedCartMessage(null)).toContain("Please check back");
  });
});
