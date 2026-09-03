import { connectToDatabase } from "@/lib/mongodb";
import { resolveCartStatus } from "@/lib/cart-status";
import { Setting } from "@/models/Setting";

export async function getCartStatus() {
  await connectToDatabase();
  const setting = await Setting.findOne({ key: "ordersEnabled" })
    .lean<{ value: boolean; reopensAt?: Date | null }>();
  return resolveCartStatus(setting);
}
