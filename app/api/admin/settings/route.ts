import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCartStatus } from "@/lib/cart-settings";
import { Order } from "@/models/Order";
import { Setting } from "@/models/Setting";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  ordersEnabled: z.boolean(),
  reopensAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const status = await getCartStatus();
    const orders = await Order.find().sort({ createdAt: -1, _id: -1 }).limit(20)
      .select("orderId customerName mobile address items flavour cupSize quantity totalPrice preferredDateTime preferredTime deliveryAt createdAt").lean();
    return NextResponse.json({ ...status, orders }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Unable to load the dashboard. Check the MongoDB connection and try again." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = toggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid cart status and reopening date/time." }, { status: 400 });
  const { ordersEnabled } = parsed.data;
  const reopensAt = ordersEnabled ? null : parsed.data.reopensAt ?? null;
  if (reopensAt && new Date(reopensAt).getTime() <= Date.now()) {
    return NextResponse.json({ message: "Choose a reopening date and time in the future." }, { status: 400 });
  }
  try {
    await connectToDatabase();
    // Store both values in one document so closing and scheduling are atomic.
    await Setting.findOneAndUpdate({ key: "ordersEnabled" }, {
      $set: { value: ordersEnabled, reopensAt: reopensAt ? new Date(reopensAt) : null },
    }, { upsert: true, new: true, runValidators: true });
    return NextResponse.json({ ordersEnabled, reopensAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Unable to save cart settings. Check the MongoDB connection and try again." }, { status: 503 });
  }
}
