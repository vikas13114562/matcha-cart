import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderForm from "@/components/OrderForm";
import { addresses } from "@/lib/addresses";

const originalAddresses = [...addresses];
afterEach(() => {
  cleanup(); vi.unstubAllGlobals();
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

  it("blocks submission without a tower and flat number", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<OrderForm />);
    fireEvent.click(screen.getByRole("button", { name: /Place Order/ }));
    expect(await screen.findByText("Select your tower", { selector: "p" })).toHaveClass("error");
    fireEvent.change(screen.getByLabelText("Tower (required)"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /Place Order/ }));
    expect(await screen.findByText("Enter your floor and flat no.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
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
