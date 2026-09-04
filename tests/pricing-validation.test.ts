import { describe, expect, it } from "vitest";
import { calculateTotal, getUnitPrice, priceItems } from "@/lib/pricing";
import { orderSchema } from "@/lib/validation";
const validOrder = { customerName:"Vikas", mobile:"9876543210", society:"Apex The Kremlin", tower:"A", flatNumber:"1204", items:[{cupSize:"500 ML",flavour:"Blueberry",quantity:3}], preferredDateTime:"2026-09-04T14:00:00.000Z" } as const;
describe("pricing",()=>{
 it("uses configured prices",()=>{ expect(getUnitPrice("300 ML","Mango")).toBe(89); expect(getUnitPrice("500 ML","Classic Matcha")).toBe(149); expect(calculateTotal("500 ML","Blueberry",3)).toBe(477); });
 it("prices mixed items",()=>expect(priceItems([{cupSize:"500 ML",flavour:"Blueberry",quantity:2},{cupSize:"500 ML",flavour:"Classic Matcha",quantity:1},{cupSize:"300 ML",flavour:"Mango",quantity:2}]).reduce((s,x)=>s+x.lineTotal,0)).toBe(645));
});
describe("order validation",()=>{
 it("accepts a valid multi-item order",()=>expect(orderSchema.safeParse(validOrder).success).toBe(true));
 it.each(["society","tower","flatNumber"])("requires %s",field=>expect(orderSchema.safeParse({...validOrder,[field]:""}).success).toBe(false));
 it("requires items and limits each quantity",()=>{expect(orderSchema.safeParse({...validOrder,items:[]}).success).toBe(false);expect(orderSchema.safeParse({...validOrder,items:[{...validOrder.items[0],quantity:11}]}).success).toBe(false);});
 it("rejects invalid details",()=>{expect(orderSchema.safeParse({...validOrder,mobile:"123"}).success).toBe(false);expect(orderSchema.safeParse({...validOrder,tower:"H"}).success).toBe(false);});
});
