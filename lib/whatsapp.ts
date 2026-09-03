export type ConfirmedOrder = {
  orderId: string;
  customerName: string;
  mobile: string;
  address?: string;
  flavour: string;
  cupSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  preferredTime: string;
};

export function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function buildWhatsAppUrl(order: ConfirmedOrder, number: string) {
  const message = `🍵 NEW MATCHA CART ORDER

Order ID: ${order.orderId}

Name: ${order.customerName}
WhatsApp: ${order.mobile}
Address: ${order.address || "Not provided"}

Flavour: ${order.flavour}
Size: ${order.cupSize}
Quantity: ${order.quantity}

Unit Price: ₹${order.unitPrice}
Total: ₹${order.totalPrice}

Preferred Time: ${formatTime(order.preferredTime)}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
