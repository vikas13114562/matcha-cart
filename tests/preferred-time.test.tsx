import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { earliestPreferredTime, preferredTimeError } from "@/lib/preferred-time";
import OrderForm from "@/components/OrderForm";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("30-minute preparation time", () => {
  const now = Date.parse("2026-09-03T14:00:00+05:30");
  it("rejects past and too-soon times but accepts exactly 30 minutes ahead", () => {
    expect(earliestPreferredTime(now)).toBe("14:30");
    for (const time of ["09:00", "14:00", "14:29"]) expect(preferredTimeError(time, now)).toContain("at least 30 minutes");
    expect(preferredTimeError("14:30", now)).toBeNull();
    expect(preferredTimeError("15:00", now)).toBeNull();
  });
  it("rounds forward so seconds never shorten the preparation buffer", () => {
    expect(earliestPreferredTime(now + 1_000)).toBe("14:31");
    expect(preferredTimeError("14:30", now + 1_000)).not.toBeNull();
  });
  it("does not interpret a past time as tomorrow", () => {
    const late = Date.parse("2026-09-03T23:30:00+05:30");
    expect(earliestPreferredTime(late)).toBeNull();
    expect(preferredTimeError("00:15", late)).toContain("tomorrow");
    expect(earliestPreferredTime(Date.parse("2026-09-03T23:29:00+05:30"))).toBe("23:59");
  });
  it("updates the picker minimum while the page stays open", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    render(<OrderForm />);
    expect(screen.getByLabelText("Pickup / preparation time")).toHaveAttribute("min", "14:30");
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(screen.getByLabelText("Pickup / preparation time")).toHaveAttribute("min", "14:31");
  });
  it("disables ordering when no valid pickup time remains today", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-03T23:30:00+05:30"));
    render(<OrderForm />);
    expect(screen.getByLabelText("Pickup / preparation time")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled();
    expect(screen.getByText(/No pickup times remain today/)).toBeInTheDocument();
  });
});
