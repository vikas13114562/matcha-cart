import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CartStorefront from "@/components/CartStorefront";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("customer storefront", () => {
  it("hides ordering and shows the scheduled reopening while closed", () => {
    render(<CartStorefront initialStatus={{ ordersEnabled: false, reopensAt: "2099-09-03T07:30:00.000Z" }}>Order form</CartStorefront>);
    expect(screen.queryByText("Order form")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sorry, the cart is currently closed.");
    expect(screen.getByRole("status")).toHaveTextContent("2099");
    expect(screen.getByRole("status")).toHaveTextContent("IST");
  });
  it("updates an already open page after the admin closes the cart", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ordersEnabled: false, reopensAt: null }) }));
    render(<CartStorefront initialStatus={{ ordersEnabled: true, reopensAt: null }}>Order form</CartStorefront>);
    expect(screen.getByText("Order form")).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.queryByText("Order form")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("currently closed");
  });
  it("reveals ordering at the scheduled time after confirming server status", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-09-03T07:29:59.000Z"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ordersEnabled: true, reopensAt: null }) }));
    render(<CartStorefront initialStatus={{ ordersEnabled: false, reopensAt: "2099-09-03T07:30:00.000Z" }}>Order form</CartStorefront>);
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(screen.getByText("Order form")).toBeInTheDocument();
  });
});
