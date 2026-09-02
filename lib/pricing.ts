export const CUP_SIZES = ["300 ML", "500 ML"] as const;
export const FLAVOURS = [
  { value: "Blueberry", emoji: "🫐" },
  { value: "Strawberry", emoji: "🍓" },
  { value: "Mango", emoji: "🥭" },
  { value: "Chocolate", emoji: "🍫" },
  { value: "Classic Matcha", emoji: "🍵" },
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

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

export function getUnitPrice(size: CupSize, flavour: Flavour) {
  return PRICING[size][flavour];
}

export function calculateTotal(size: CupSize, flavour: Flavour, quantity: number) {
  return getUnitPrice(size, flavour) * quantity;
}
