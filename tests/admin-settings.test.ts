// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), connect: vi.fn(), setting: vi.fn(), update: vi.fn(), find: vi.fn(),
  sort: vi.fn(), limit: vi.fn(), select: vi.fn(), orders: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdminAuthenticated: mocks.auth }));
vi.mock("@/lib/mongodb", () => ({ connectToDatabase: mocks.connect }));
vi.mock("@/models/Setting", () => ({ Setting: {
  findOne: () => ({ lean: mocks.setting }), findOneAndUpdate: mocks.update,
} }));
vi.mock("@/models/Order", () => ({ Order: { find: mocks.find } }));
import { GET, PATCH } from "@/app/api/admin/settings/route";
import { GET as publicStatus } from "@/app/api/cart/status/route";
import { POST as submitOrder } from "@/app/api/orders/route";

function request(body: unknown) {
  return new Request("http://localhost/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(true);
  mocks.connect.mockResolvedValue(undefined);
  mocks.setting.mockResolvedValue({ value: true });
  mocks.update.mockResolvedValue({});
  mocks.find.mockReturnValue({ sort: mocks.sort });
  mocks.sort.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ lean: mocks.orders });
  mocks.orders.mockResolvedValue([{ orderId: "MC-1000" }]);
});

describe("admin settings API", () => {
  it("requires authentication for reads and writes", async () => {
    mocks.auth.mockResolvedValue(false);
    expect((await GET()).status).toBe(401);
    expect((await PATCH(request({ ordersEnabled: false }))).status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("loads the newest 20 orders with the cart state", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(mocks.limit).toHaveBeenCalledWith(20);
    expect(await response.json()).toMatchObject({ ordersEnabled: true, reopensAt: null, orders: [{ orderId: "MC-1000" }] });
  });
  it("saves the closed status and reopening date together", async () => {
    const reopensAt = "2099-09-03T07:30:00.000Z";
    const response = await PATCH(request({ ordersEnabled: false, reopensAt }));
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ key: "ordersEnabled" }, {
      $set: { value: false, reopensAt: new Date(reopensAt) },
    }, { upsert: true, new: true, runValidators: true });
    expect(await response.json()).toEqual({ ordersEnabled: false, reopensAt });
  });
  it("clears the schedule when manually opened or closed without a time", async () => {
    for (const ordersEnabled of [true, false]) {
      const response = await PATCH(request({ ordersEnabled }));
      expect(await response.json()).toEqual({ ordersEnabled, reopensAt: null });
    }
  });
  it.each(["not-a-date", "2020-01-01T00:00:00.000Z"])("rejects invalid/past reopening date %s", async reopensAt => {
    expect((await PATCH(request({ ordersEnabled: false, reopensAt }))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    expect((await PATCH(new Request("http://localhost/api/admin/settings", { method: "PATCH", body: "{" }))).status).toBe(400);
  });
  it("reports database failures without pretending the cart is open", async () => {
    mocks.connect.mockRejectedValue(new Error("database offline"));
    expect((await GET()).status).toBe(503);
    expect((await publicStatus()).status).toBe(503);
  });
  it("public status exposes no orders or customer information", async () => {
    const response = await publicStatus();
    expect(await response.json()).toEqual({ ordersEnabled: true, reopensAt: null });
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("rejects order submissions while closed with the reopening message", async () => {
    mocks.setting.mockResolvedValue({ value: false, reopensAt: "2099-09-03T07:30:00.000Z" });
    const response = await submitOrder(new Request("http://localhost/api/orders", { method: "POST", body: JSON.stringify({
      customerName: "Test customer", mobile: "9876543210", society: "Apex The Kremlin", tower: "A", flatNumber: "1204", cupSize: "500 ML", flavour: "Blueberry", quantity: 3, preferredTime: "19:30",
    }) }));
    expect(response.status).toBe(409);
    expect((await response.json()).message).toContain("We will open again on");
  });
});
