import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeliveryDetails } from "@/lib/preferred-time";
import OrderForm from "@/components/OrderForm";

// Keep the device clock fixed so delivery previews are deterministic.
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("automatic 30-minute delivery", () => {
  const now = Date.parse("2026-09-03T14:00:15+05:30");
  it("schedules delivery exactly 30 minutes after the order, including seconds", () => {
    const delivery = getDeliveryDetails(now);
    expect(Date.parse(delivery.deliveryAt) - now).toBe(30 * 60_000);
    expect(delivery.preferredTime).toBe("14:30");
  });
  it("preserves the delivery date when the estimate crosses midnight", () => {
    const delivery = getDeliveryDetails(Date.parse("2026-09-03T23:45:00+05:30"));
    expect(delivery.preferredTime).toBe("00:15");
    expect(delivery.deliveryAt).toBe("2026-09-03T18:45:00.000Z");
  });
  it("shows a read-only estimate and updates it while the page stays open", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    render(<OrderForm />);
    const field = screen.getByLabelText("Estimated delivery time (IST)");
    expect(field).toHaveValue("14:30");
    expect(field).toHaveAttribute("readonly");
    expect(screen.getByText(/Delivery is scheduled for 30 minutes after you place your order/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(field).toHaveValue("14:31");
  });
  it("allows an automatic estimate across midnight", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-03T23:45:00+05:30"));
    render(<OrderForm />);
    expect(screen.getByLabelText("Estimated delivery time (IST)")).toHaveValue("00:15");
    expect(screen.getByRole("button", { name: /Place Order/ })).toBeEnabled();
  });
});
