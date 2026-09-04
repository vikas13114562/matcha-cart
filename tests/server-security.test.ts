import { describe, expect, it } from "vitest";
import { canAcceptOrders, orderErrorMessage, prepareTrustedOrder } from "@/app/api/orders/route";
import { safeEqual } from "@/app/api/admin/login/route";
import { orderSchema } from "@/lib/validation";
const input=orderSchema.parse({customerName:"Vikas",mobile:"9876543210",society:"Apex The Kremlin",tower:"A",flatNumber:"1204",items:[{cupSize:"500 ML",flavour:"Blueberry",quantity:2},{cupSize:"300 ML",flavour:"Mango",quantity:2}],preferredDateTime:"2026-09-04T14:00:00.000Z"});
describe("server trust boundaries",()=>{
 it("builds trusted address and recalculates every price",()=>expect(prepareTrustedOrder(input)).toMatchObject({address:"Flat 1204, Tower A, Apex The Kremlin, Pratap Vihar, Ghaziabad, Uttar Pradesh - 201009",totalPrice:496,items:[{unitPrice:159,lineTotal:318},{unitPrice:89,lineTotal:178}]}));
 it("handles cart state",()=>{expect(canAcceptOrders({value:false})).toBe(false);expect(canAcceptOrders(null)).toBe(true);});
 it("compares credentials exactly",()=>{expect(safeEqual("admin","admin")).toBe(true);expect(safeEqual("x","admin")).toBe(false);});
 it("returns database messages",()=>expect(orderErrorMessage(new Error("MONGODB_URI is not configured"))).toContain("not configured"));
});
