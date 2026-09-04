const MINUTE = 60_000;
export const PREPARATION_MINUTES = 30;
export const MAX_SCHEDULE_HOURS = 4;

export function getTimeSlots(now = Date.now()) {
  const first = Math.ceil((now + PREPARATION_MINUTES * MINUTE) / (15 * MINUTE)) * 15 * MINUTE;
  const last = now + MAX_SCHEDULE_HOURS * 60 * MINUTE;
  const slots: string[] = [];
  for (let value = first; value <= last; value += 15 * MINUTE) slots.push(new Date(value).toISOString());
  return slots;
}

export function preferredDateTimeError(value: string, now = Date.now()) {
  const selected = Date.parse(value);
  if (!Number.isFinite(selected)) return "Select your preferred time.";
  if (selected < now + PREPARATION_MINUTES * MINUTE) return "Choose a time at least 30 minutes from now.";
  if (selected > now + MAX_SCHEDULE_HOURS * 60 * MINUTE) return "Choose a time within the next 4 hours.";
  if (new Date(selected).getMinutes() % 15) return "Choose a 15-minute time slot.";
  return undefined;
}

export function formatPreferredDateTime(value: string | Date, now = Date.now()) {
  const date = new Date(value);
  const current = new Date(now);
  const inIndia = (d: Date) => new Date(d.getTime() + 330 * MINUTE).toISOString().slice(0, 10);
  const day = inIndia(date), today = inIndia(current);
  const tomorrow = inIndia(new Date(now + 24 * 60 * MINUTE));
  const label = day === today ? "Today" : day === tomorrow ? "Tomorrow" : date.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
  return `${label}, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}`;
}
