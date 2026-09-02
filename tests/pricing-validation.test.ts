import { describe, expect, it } from "vitest";
import { calculateTotal, getUnitPrice } from "@/lib/pricing";
import { orderSchema } from "@/lib/validation";

const validOrder = { customerName: "Vikas", mobile: "9876543210", address: "", cupSize: "500 ML", flavour: "Blueberry", quantity: 3, preferredTime: "19:30" } as const;

describe("pricing", () => {
  it("charges ₹89 for every 300 ML flavour", () => {
    for (const flavour of ["Blueberry", "Strawberry", "Mango", "Chocolate", "Classic Matcha"] as const) expect(getUnitPrice("300 ML", flavour)).toBe(89);
  });
  it("charges ₹149 for 500 ML classic and ₹159 for the others", () => {
    expect(getUnitPrice("500 ML", "Classic Matcha")).toBe(149);
    for (const flavour of ["Blueberry", "Strawberry", "Mango", "Chocolate"] as const) expect(getUnitPrice("500 ML", flavour)).toBe(159);
  });
  it("calculates ₹159 × 3 as ₹477", () => expect(calculateTotal("500 ML", "Blueberry", 3)).toBe(477));
});

describe("order validation", () => {
  it("accepts an empty optional address", () => expect(orderSchema.safeParse(validOrder).success).toBe(true));
  it("rejects missing required fields", () => expect(orderSchema.safeParse({}).success).toBe(false));
  it("rejects invalid Indian mobile numbers", () => expect(orderSchema.safeParse({ ...validOrder, mobile: "12345" }).success).toBe(false));
  it("keeps quantity between 1 and 10", () => {
    expect(orderSchema.safeParse({ ...validOrder, quantity: 0 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...validOrder, quantity: 11 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...validOrder, quantity: 1 }).success).toBe(true);
    expect(orderSchema.safeParse({ ...validOrder, quantity: 10 }).success).toBe(true);
  });
});
