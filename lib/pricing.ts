export const CUP_SIZES = ["300 ML", "500 ML"] as const;
export const FLAVOURS = [
  { value: "Blueberry", image: "/drinks/blueberry.webp" },
  { value: "Strawberry", image: "/drinks/strawberry.webp" },
  { value: "Mango", image: "/drinks/mango.webp" },
  { value: "Chocolate", image: "/drinks/chocolate.webp" },
  { value: "Classic Matcha", image: "/drinks/classic.webp" },
] as const;

export type CupSize = (typeof CUP_SIZES)[number];
export type Flavour = (typeof FLAVOURS)[number]["value"];

export const PRICING: Record<CupSize, Record<Flavour, number>> = {
  "300 ML": {
    Blueberry: 89,
    Strawberry: 89,
    Mango: 89,
    Chocolate: 89,
    "Classic Matcha": 89,
  },
  "500 ML": {
    Blueberry: 159,
    Strawberry: 159,
    Mango: 159,
    Chocolate: 159,
    "Classic Matcha": 149,
  },
};

export const MIN_QUANTITY = 0;
export const MAX_QUANTITY = 10;

export function getUnitPrice(size: CupSize, flavour: Flavour) {
  return PRICING[size][flavour];
}

export function calculateTotal(size: CupSize, flavour: Flavour, quantity: number) {
  return getUnitPrice(size, flavour) * quantity;
}

export type OrderItemInput = { cupSize: CupSize; flavour: Flavour; quantity: number };
export function priceItems(items: OrderItemInput[]) {
  return items.filter(item => item.quantity > 0).map(item => {
    const unitPrice = getUnitPrice(item.cupSize, item.flavour);
    return { ...item, unitPrice, lineTotal: unitPrice * item.quantity };
  });
}
