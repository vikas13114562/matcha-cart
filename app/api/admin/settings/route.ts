import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Setting } from "@/models/Setting";

const toggleSchema = z.object({ ordersEnabled: z.boolean() });

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const [setting, orders] = await Promise.all([
      Setting.findOne({ key: "ordersEnabled" }).lean<{ value: boolean }>(),
      Order.find().sort({ createdAt: -1 }).limit(20).select("orderId customerName mobile flavour cupSize quantity totalPrice preferredTime createdAt").lean(),
    ]);
    return NextResponse.json({ ordersEnabled: setting?.value ?? true, orders });
  } catch {
    return NextResponse.json({ message: "Unable to load the dashboard." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const parsed = toggleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Invalid setting." }, { status: 400 });
    await connectToDatabase();
    await Setting.findOneAndUpdate({ key: "ordersEnabled" }, { value: parsed.data.ordersEnabled }, { upsert: true, new: true });
    return NextResponse.json({ ordersEnabled: parsed.data.ordersEnabled });
  } catch {
    return NextResponse.json({ message: "Unable to update order status." }, { status: 500 });
  }
}
