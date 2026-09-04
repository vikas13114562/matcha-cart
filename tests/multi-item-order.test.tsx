import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OrderForm from "@/components/OrderForm";

afterEach(cleanup);
describe("multi-item menu", () => {
  it("keeps quantities across sizes and totals mixed pricing", () => {
    render(<OrderForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add one Blueberry 500 ML" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Blueberry 500 ML" }));
    fireEvent.click(screen.getByRole("button", { name: /^300 ML/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Mango 300 ML" }));
    expect(screen.getByText("500 ML × 2")).toBeInTheDocument();
    expect(screen.getByText("300 ML × 1")).toBeInTheDocument();
    expect(screen.getByText("₹407")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^500 ML/ }));
    expect(screen.getByRole("button", { name: "Remove one Blueberry 500 ML" })).toBeInTheDocument();
  });

  it("calculates the required ₹645 mixed order", () => {
    render(<OrderForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add one Blueberry 500 ML" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Blueberry 500 ML" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Classic Matcha 500 ML" }));
    fireEvent.click(screen.getByRole("button", { name: /^300 ML/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Mango 300 ML" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Mango 300 ML" }));
    expect(screen.getByText("₹645")).toBeInTheDocument();
  });
});
