import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateTotal, getUnitPrice } from "@/lib/pricing";
import { orderSchema } from "@/lib/validation";
import { Order } from "@/models/Order";
import { getCartStatus } from "@/lib/cart-settings";
import { closedCartMessage } from "@/lib/cart-status";
import { formatDeliveryAddress } from "@/lib/addresses";
import { getDeliveryDetails } from "@/lib/preferred-time";

function newOrderId() {
  return `MC-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function prepareTrustedOrder(input: ReturnType<typeof orderSchema.parse>, now = Date.now()) {
  const unitPrice = getUnitPrice(input.cupSize, input.flavour);
  return { ...input, ...getDeliveryDetails(now), address: formatDeliveryAddress(input), unitPrice, totalPrice: calculateTotal(input.cupSize, input.flavour, input.quantity) };
}

export function canAcceptOrders(setting: { value: boolean } | null) {
  return setting?.value !== false;
}

export function orderErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "MONGODB_URI is not configured") {
    return "Ordering is not configured yet. Please contact Matcha Cart.";
  }
  if (error instanceof Error && ["MongooseServerSelectionError", "MongoServerSelectionError"].includes(error.name)) {
    return "Ordering is temporarily unavailable. Please try again shortly.";
  }
  return "Something went wrong while placing your order. Please try again.";
}

export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Please check your order details and try again." }, { status: 400 });
    await connectToDatabase();
    const status = await getCartStatus();
    if (!status.ordersEnabled) return NextResponse.json({ message: closedCartMessage(status.reopensAt) }, { status: 409 });

    const input = parsed.data;
    const trusted = prepareTrustedOrder(input);
    let saved;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        saved = await Order.create({ ...trusted, orderId: newOrderId() });
        break;
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
      }
    }
    if (!saved) throw new Error("Could not allocate order ID");
    const order = {
      orderId: saved.orderId, customerName: saved.customerName, mobile: saved.mobile,
      address: saved.address, cupSize: saved.cupSize, flavour: saved.flavour,
      quantity: saved.quantity, unitPrice: saved.unitPrice, totalPrice: saved.totalPrice,
      preferredTime: saved.preferredTime,
      deliveryAt: saved.deliveryAt,
    };
    return NextResponse.json({ order, whatsappNumber: process.env.WHATSAPP_ORDER_NUMBER || "917734015723" }, { status: 201 });
  } catch (error) {
    // Keep connection strings and customer details out of server logs.
    console.error("Order submission failed", {
      databaseConfigured: Boolean(process.env.MONGODB_URI),
      name: error instanceof Error ? error.name : "UnknownError",
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
    });
    return NextResponse.json({ message: orderErrorMessage(error) }, { status: 500 });
  }
}
