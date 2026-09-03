const MINUTE = 60_000;
const INDIA_OFFSET = 330 * MINUTE;

export const PREPARATION_MINUTES = 30;

export function getDeliveryDetails(now = Date.now()) {
  const delivery = now + PREPARATION_MINUTES * MINUTE;
  return {
    deliveryAt: new Date(delivery).toISOString(),
    preferredTime: new Date(delivery + INDIA_OFFSET).toISOString().slice(11, 16),
  };
}

export function getDeliveryTime() {
  return getDeliveryDetails().preferredTime;
}
