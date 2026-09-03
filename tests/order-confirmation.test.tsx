import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderForm from "@/components/OrderForm";

const savedOrder = {
  orderId: "MC-1234", customerName: "Test Customer", mobile: "9876543210",
  address: "Flat 1204, Tower A, Apex The Kremlin, Pratap Vihar, Ghaziabad, Uttar Pradesh - 201009", cupSize: "500 ML", flavour: "Blueberry", quantity: 2,
  unitPrice: 159, totalPrice: 318, preferredTime: "10:30", deliveryAt: "2026-09-03T05:00:00.000Z",
};

beforeEach(() => { vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-03T10:00:00+05:30")); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function placeOrder() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ order: savedOrder, whatsappNumber: "919876543210" }),
  }));
  render(<OrderForm />);
  fireEvent.change(screen.getByLabelText("Name", { exact: true }), { target: { value: savedOrder.customerName } });
  fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: savedOrder.mobile } });
  fireEvent.change(screen.getByLabelText("Tower (required)"), { target: { value: "A" } });
  fireEvent.change(screen.getByLabelText("Enter floor and flat no. (required)"), { target: { value: "1204" } });
  fireEvent.click(screen.getByRole("button", { name: /500 ML/ }));
  fireEvent.click(screen.getByRole("button", { name: /Blueberry/ }));
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  fireEvent.change(screen.getByLabelText("Preferred time"), { target: { value: "10:30" } });
  fireEvent.click(screen.getByRole("button", { name: /Place Order/ }));
  return await screen.findByRole("dialog");
}

function openWhatsApp(dialog: HTMLElement) {
  const link = within(dialog).getByRole("link", { name: "Send Order on WhatsApp" });
  // Verify the outbound link without opening WhatsApp or sending a message.
  expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/919876543210?text="));
  expect(link).toHaveAttribute("target", "_blank");
  link.addEventListener("click", event => event.preventDefault(), { once: true });
  fireEvent.click(link);
}

describe("order confirmation flow", () => {
  it("keeps the dialog open with a thank-you and contact number after opening WhatsApp", async () => {
    const dialog = await placeOrder();
    expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    openWhatsApp(dialog);
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Thank you for your order!" })).toHaveFocus();
    expect(within(dialog).getByText(savedOrder.mobile)).toBeInTheDocument();
    expect(within(dialog).getByText(/Please make sure you press/)).toBeInTheDocument();
    expect(within(dialog).queryByAltText("PhonePe payment QR code")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue(savedOrder.customerName);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    { openWhatsAppFirst: true, closeControl: "Close" },
    { openWhatsAppFirst: true, closeControl: "Close order details" },
    { openWhatsAppFirst: false, closeControl: "Close order details" },
  ])("resets the form using $closeControl (WhatsApp opened: $openWhatsAppFirst)", async ({ openWhatsAppFirst, closeControl }) => {
    const dialog = await placeOrder();
    if (openWhatsAppFirst) openWhatsApp(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: closeControl }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("WhatsApp number")).toHaveValue("");
    expect(screen.getByLabelText("Society (required)")).toHaveValue("Apex The Kremlin");
    expect(screen.getByLabelText("Tower (required)")).toHaveValue("");
    expect(screen.queryByLabelText("Enter floor and flat no. (required)")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tower (required)"), { target: { value: "A" } });
    expect(screen.getByLabelText("Enter floor and flat no. (required)")).toHaveValue("");
    expect(screen.getByLabelText("Preferred time")).toHaveValue("");
    expect(screen.getByRole("button", { name: /500 ML/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Blueberry/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("1");
    expect(screen.getByText("₹0")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
