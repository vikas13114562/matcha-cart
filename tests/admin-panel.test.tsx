import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "@/components/AdminPanel";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function response(data: object, status = 200) {
  return { ok: status < 400, status, json: async () => data };
}

describe("admin dashboard", () => {
  it("closes the cart with a reopening time entered in IST", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ordersEnabled: true, reopensAt: null, orders: [] }))
      .mockResolvedValueOnce(response({ ordersEnabled: false, reopensAt: "2099-09-03T07:30:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminPanel initiallyAuthenticated />);
    await screen.findByRole("button", { name: "Turn orders OFF" });
    fireEvent.change(screen.getByLabelText("Reopening date and time (IST)"), { target: { value: "2099-09-03T13:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Close cart and schedule reopening" }));
    await screen.findByText("Scheduled reopening:");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ ordersEnabled: false, reopensAt: "2099-09-03T07:30:00.000Z" });
    expect(screen.getByRole("button", { name: "Turn orders ON" })).toBeEnabled();
  });

  it("cancels a schedule while keeping the cart closed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ordersEnabled: false, reopensAt: "2099-09-03T07:30:00.000Z", orders: [] }))
      .mockResolvedValueOnce(response({ ordersEnabled: false, reopensAt: null }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminPanel initiallyAuthenticated />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel scheduled reopening" }));
    await screen.findByText("The cart will stay closed until you turn it on or schedule a reopening.");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ ordersEnabled: false, reopensAt: null });
  });

  it("explains missing API routes instead of exposing a JSON parse error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({}, 404)));
    render(<AdminPanel initiallyAuthenticated />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Restart the development server");
  });

  it("keeps the switch disabled until the saved status loads", async () => {
    let resolve!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(value => { resolve = value; })));
    render(<AdminPanel initiallyAuthenticated />);
    expect(screen.getByRole("button", { name: "Turn orders ON / OFF" })).toBeDisabled();
    expect(screen.queryByText(/ACCEPTING ORDERS/)).not.toBeInTheDocument();
    resolve(response({ ordersEnabled: false, orders: [] }));
    expect(await screen.findByRole("button", { name: "Turn orders ON" })).toBeEnabled();
  });

  it("allows retry after a failed load without claiming there are no orders", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response({ ordersEnabled: false, orders: [] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminPanel initiallyAuthenticated />);
    await screen.findByText("Order status unavailable");
    expect(screen.queryByText("No orders yet.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turn orders ON / OFF" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Refresh dashboard" }));
    expect(await screen.findByRole("button", { name: "Turn orders ON" })).toBeEnabled();
  });

  it("asks for login when the session expires during an update", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ ordersEnabled: true, orders: [] }))
      .mockResolvedValueOnce(response({ message: "Unauthorized" }, 401)));
    render(<AdminPanel initiallyAuthenticated />);
    fireEvent.click(await screen.findByRole("button", { name: "Turn orders OFF" }));
    expect(await screen.findByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Your session expired. Please sign in again.")).toBeInTheDocument();
  });

  it("keeps the saved setting when an update fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ ordersEnabled: false, orders: [] }))
      .mockResolvedValueOnce(response({ message: "Unable to update order status." }, 500)));
    render(<AdminPanel initiallyAuthenticated />);
    fireEvent.click(await screen.findByRole("button", { name: "Turn orders ON" }));
    await screen.findByText("Unable to update order status.");
    expect(screen.getByText(/ORDERS PAUSED/)).toBeInTheDocument();
  });

  it("does not pretend logout succeeded when the server rejects it", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ ordersEnabled: true, orders: [] }))
      .mockResolvedValueOnce(response({}, 500)));
    render(<AdminPanel initiallyAuthenticated />);
    await screen.findByRole("button", { name: "Turn orders OFF" });
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(screen.getByText("Unable to log out. Please try again.")).toBeInTheDocument());
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });
});
