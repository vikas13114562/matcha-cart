import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeliveryDetails, preferredTimeError } from "@/lib/preferred-time";
import OrderForm from "@/components/OrderForm";
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("preferred time", () => {
  const now = Date.parse("2026-09-03T14:00:00+05:30");
  it("checks the exact 30-minute boundary", () => {
    expect(preferredTimeError("14:29", now)).toContain("at least 30 minutes");
    expect(preferredTimeError("13:00", now)).toContain("at least 30 minutes");
    expect(preferredTimeError("14:30", now)).toBeUndefined();
    expect(preferredTimeError("19:30", now)).toBeUndefined();
    expect(preferredTimeError("14:30", now + 1000)).toContain("at least 30 minutes");
  });
  it("preserves the selected time across midnight", () => {
    const late = Date.parse("2026-09-03T23:45:00+05:30");
    expect(preferredTimeError("00:10", late)).toContain("at least 30 minutes");
    expect(preferredTimeError("00:30", late)).toBeUndefined();
    expect(getDeliveryDetails(late, "00:30")).toEqual({ preferredTime: "00:30", deliveryAt: "2026-09-03T19:00:00.000Z" });
  });
  it("retains selection as time passes and displays validation on change", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    render(<OrderForm />);
    const field = screen.getByLabelText("Preferred time");
    expect(field).not.toHaveAttribute("readonly");
    fireEvent.change(field, { target: { value: "14:29" } });
    expect(screen.getByRole("alert")).toHaveTextContent("at least 30 minutes");
    fireEvent.change(field, { target: { value: "16:00" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(field).toHaveValue("16:00");
    expect(screen.getByText("4:00 PM IST")).toBeInTheDocument();
  });
});
