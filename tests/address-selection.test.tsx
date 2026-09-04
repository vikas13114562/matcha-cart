import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderForm from "@/components/OrderForm";
import { addresses } from "@/lib/addresses";

const originalAddresses = [...addresses];
beforeEach(() => { vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-03T10:00:00+05:30")); });
afterEach(() => {
  cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  addresses.splice(0, addresses.length, ...originalAddresses);
});

describe("delivery address selection", () => {
  it("preselects the only society and reveals the flat field after tower selection", () => {
    render(<OrderForm />);
    expect(screen.getByLabelText("Society (required)")).toHaveValue("Apex The Kremlin");
    const tower = screen.getByLabelText("Tower (required)");
    expect(tower).toHaveValue("");
    expect(within(tower).getAllByRole("option").map(option => option.textContent)).toEqual([
      "Select your tower", "Tower A", "Tower B", "Tower C", "Tower D", "Tower E", "Tower F", "Tower G",
    ]);
    expect(screen.queryByLabelText("Enter floor and flat no. (required)")).not.toBeInTheDocument();
    fireEvent.change(tower, { target: { value: "G" } });
    expect(screen.getByLabelText("Enter floor and flat no. (required)")).toBeRequired();
  });

  it("keeps Place Order disabled until a drink is selected", () => {
    render(<OrderForm />);
    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add one Blueberry 500 ML" }));
    expect(screen.getByRole("button", { name: /Place Order/ })).toBeEnabled();
  });

  it("supports additional societies and clears dependent address fields when changed", () => {
    addresses.push({ society: "Test Society", Towers: ["Z"], Area: "Test Area", city: "Test City", state: "Test State", pincode: "123456" });
    render(<OrderForm />);
    const society = screen.getByLabelText("Society (required)");
    const tower = screen.getByLabelText("Tower (required)");
    expect(society).toHaveValue("");
    expect(tower).toBeDisabled();
    fireEvent.change(society, { target: { value: "Apex The Kremlin" } });
    fireEvent.change(tower, { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText("Enter floor and flat no. (required)"), { target: { value: "101A" } });
    fireEvent.change(society, { target: { value: "Test Society" } });
    expect(tower).toHaveValue("");
    expect(within(tower).queryByRole("option", { name: "Tower A" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Enter floor and flat no. (required)")).not.toBeInTheDocument();
    fireEvent.change(tower, { target: { value: "Z" } });
    expect(screen.getByLabelText("Enter floor and flat no. (required)")).toHaveValue("");
  });
});
