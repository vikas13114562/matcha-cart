const MINUTE = 60_000;
const INDIA_OFFSET = 330 * MINUTE;
const DAY = 24 * 60 * MINUTE;

export const PREPARATION_MINUTES = 30;

// The time-only field represents today in India, where the cart operates.
export function earliestPreferredTime(now = Date.now()): string | null {
  const indiaNow = now + INDIA_OFFSET;
  const earliest = Math.ceil((indiaNow + PREPARATION_MINUTES * MINUTE) / MINUTE) * MINUTE;
  if (Math.floor(earliest / DAY) !== Math.floor(indiaNow / DAY)) return null;
  return new Date(earliest).toISOString().slice(11, 16);
}

export function preferredTimeError(value: string, now = Date.now()): string | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Choose a preferred time";
  const earliest = earliestPreferredTime(now);
  if (earliest === null) return "No pickup times remain today. Please order again tomorrow.";
  if (value < earliest) return "Choose a pickup time at least 30 minutes from now (IST).";
  return null;
}
