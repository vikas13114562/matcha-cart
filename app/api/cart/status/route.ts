import { NextResponse } from "next/server";
import { getCartStatus } from "@/lib/cart-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCartStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "The cart is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
