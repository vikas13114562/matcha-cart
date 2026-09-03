export type CartStatus = { ordersEnabled: boolean; reopensAt: string | null };

export function resolveCartStatus(
  setting: { value: boolean; reopensAt?: Date | string | null } | null,
  now = Date.now(),
): CartStatus {
  const opening = setting?.reopensAt ? new Date(setting.reopensAt).getTime() : NaN;
  const ordersEnabled = setting?.value !== false || (Number.isFinite(opening) && opening <= now);
  return {
    ordersEnabled,
    reopensAt: !ordersEnabled && Number.isFinite(opening) ? new Date(opening).toISOString() : null,
  };
}

export function formatOpeningTime(value: string) {
  // Use a fixed format: Node and browsers can have different Intl punctuation.
  const india = new Date(new Date(value).getTime() + 330 * 60_000);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const hours = india.getUTCHours();
  const time = `${hours % 12 || 12}:${String(india.getUTCMinutes()).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
  return `${weekdays[india.getUTCDay()]}, ${india.getUTCDate()} ${months[india.getUTCMonth()]} ${india.getUTCFullYear()} at ${time} IST`;
}

// datetime-local has no timezone; the admin field always represents India time.
export function toIndiaDateTimeInput(value: string | null) {
  return value ? new Date(new Date(value).getTime() + 330 * 60_000).toISOString().slice(0, 16) : "";
}

export function fromIndiaDateTimeInput(value: string) {
  return new Date(`${value}:00+05:30`).toISOString();
}

export function closedCartMessage(reopensAt: string | null) {
  return `Sorry, the cart is currently closed. ${reopensAt ? `We will open again on ${formatOpeningTime(reopensAt)}.` : "Please check back again soon."}`;
}
