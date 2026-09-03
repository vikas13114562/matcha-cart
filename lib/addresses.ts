export type SocietyAddress = {
  society: string;
  Towers: string[];
  Area: string;
  city: string;
  state: string;
  pincode: string;
};

// Add more societies here using the same format.
export const addresses: SocietyAddress[] = [
  {
    society: "Apex The Kremlin",
    Towers: ["A", "B", "C", "D", "E", "F", "G"],
    Area: "Pratap Vihar",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    pincode: "201009",
  },
];

export function formatDeliveryAddress(input: { society: string; tower: string; flatNumber: string }) {
  const location = addresses.find(item => item.society === input.society);
  if (!location || !location.Towers.includes(input.tower) || !input.flatNumber.trim()) {
    throw new Error("Select a supported society, tower, and flat number.");
  }
  return `Flat ${input.flatNumber.trim()}, Tower ${input.tower}, ${location.society}, ${location.Area}, ${location.city}, ${location.state} - ${location.pincode}`;
}
