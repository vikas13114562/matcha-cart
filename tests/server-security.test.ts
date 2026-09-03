import { describe, expect, it } from "vitest";
import { canAcceptOrders, orderErrorMessage, prepareTrustedOrder } from "@/app/api/orders/route";
import { safeEqual } from "@/app/api/admin/login/route";
import { orderSchema } from "@/lib/validation";

const input = orderSchema.parse({ customerName: "Vikas", mobile: "9876543210", cupSize: "500 ML", flavour: "Blueberry", quantity: 3, preferredTime: "19:30" });

describe("server trust boundaries", () => {
  it("recalculates unit and total price from validated selections", () => expect(prepareTrustedOrder({ ...input, unitPrice: 1, totalPrice: 1 } as typeof input)).toMatchObject({ unitPrice: 159, totalPrice: 477 }));
  it("blocks orders only when the stored setting is explicitly false", () => {
    expect(canAcceptOrders({ value: false })).toBe(false);
    expect(canAcceptOrders({ value: true })).toBe(true);
    expect(canAcceptOrders(null)).toBe(true);
  });
  it("accepts only exact admin credentials", () => {
    expect(safeEqual("admin", "admin")).toBe(true);
    expect(safeEqual("customer", "admin")).toBe(false);
  });
  it("returns actionable database configuration errors", () => {
    expect(orderErrorMessage(new Error("MONGODB_URI is not configured"))).toContain("not configured");
    const unavailable = new Error("connection failed");
    unavailable.name = "MongooseServerSelectionError";
    expect(orderErrorMessage(unavailable)).toContain("temporarily unavailable");
  });
});
