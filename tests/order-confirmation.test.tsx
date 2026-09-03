import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderForm from "@/components/OrderForm";

const savedOrder = {
  orderId: "MC-1234", customerName: "Test Customer", mobile: "9876543210",
  address: "Test address", cupSize: "500 ML", flavour: "Blueberry", quantity: 2,
  unitPrice: 159, totalPrice: 318, preferredTime: "19:30",
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function placeOrder() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ order: savedOrder, whatsappNumber: "919876543210" }),
  }));
  render(<OrderForm />);
  fireEvent.change(screen.getByLabelText("Name", { exact: true }), { target: { value: savedOrder.customerName } });
  fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: savedOrder.mobile } });
  fireEvent.change(screen.getByLabelText(/Address/), { target: { value: savedOrder.address } });
  fireEvent.click(screen.getByRole("button", { name: /500 ML/ }));
  fireEvent.click(screen.getByRole("button", { name: /Blueberry/ }));
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  fireEvent.change(screen.getByLabelText("Pickup / preparation time"), { target: { value: savedOrder.preferredTime } });
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
    openWhatsApp(dialog);
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
    { openWhatsAppFirst: false, closeControl: "Close" },
    { openWhatsAppFirst: false, closeControl: "Close order details" },
  ])("resets the form using $closeControl (WhatsApp opened: $openWhatsAppFirst)", async ({ openWhatsAppFirst, closeControl }) => {
    const dialog = await placeOrder();
    if (openWhatsAppFirst) openWhatsApp(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: closeControl }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("WhatsApp number")).toHaveValue("");
    expect(screen.getByLabelText(/Address/)).toHaveValue("");
    expect(screen.getByLabelText("Pickup / preparation time")).toHaveValue("");
    expect(screen.getByRole("button", { name: /500 ML/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Blueberry/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("1");
    expect(screen.getByText("₹0")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
