const MINUTE = 60_000;
const INDIA_OFFSET = 330 * MINUTE;

export const PREPARATION_MINUTES = 30;

export function getDeliveryDetails(now = Date.now(), preferredTime?: string) {
  const earliest = Math.ceil((now + PREPARATION_MINUTES * MINUTE) / MINUTE) * MINUTE;
  const date = new Date(earliest + INDIA_OFFSET).toISOString().slice(0, 10);
  const delivery = preferredTime ? Date.parse(`${date}T${preferredTime}:00+05:30`) : earliest;
  return {
    deliveryAt: new Date(delivery).toISOString(),
    preferredTime: new Date(delivery + INDIA_OFFSET).toISOString().slice(11, 16),
  };
}

export function preferredTimeError(time: string, now = Date.now()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "Select your preferred time.";
  if (Date.parse(getDeliveryDetails(now, time).deliveryAt) < now + PREPARATION_MINUTES * MINUTE) {
    return "Preferred time should be at least 30 minutes ahead of the current time.";
  }
  return undefined;
}

export function getDeliveryTime() {
  return getDeliveryDetails().preferredTime;
}
