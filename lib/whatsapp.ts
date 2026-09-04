import { formatPreferredDateTime } from "@/lib/preferred-time";
export type ConfirmedItem = { flavour: string; cupSize: string; quantity: number; unitPrice: number; lineTotal: number };
export type ConfirmedOrder = { orderId: string; customerName: string; mobile: string; address?: string; items: ConfirmedItem[]; totalPrice: number; preferredDateTime: string };
export function formatTime(value: string) { const [h, m] = value.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`; }
export function formatDeliveryTime(order: { preferredDateTime?: string; deliveryAt?: string; preferredTime?: string }) { const value = order.preferredDateTime || order.deliveryAt; return value ? formatPreferredDateTime(value) : `${formatTime(order.preferredTime || "00:00")} IST`; }
export function buildWhatsAppUrl(order: ConfirmedOrder, number: string) {
  const lines = order.items.map(item => `${item.quantity} × ${item.flavour === "Classic Matcha" ? item.flavour : `${item.flavour} Matcha`} — ${item.cupSize}\n₹${item.unitPrice} × ${item.quantity} = ₹${item.lineTotal}`).join("\n\n");
  const message = `🍵 NEW MATCHA CART ORDER\n\nOrder ID: ${order.orderId}\n\nName: ${order.customerName}\nWhatsApp: ${order.mobile}\nAddress: ${order.address || "Not provided"}\n\nORDER\n\n${lines}\n\nTotal: ₹${order.totalPrice}\n\nPreferred Time:\n${formatDeliveryTime(order)}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
