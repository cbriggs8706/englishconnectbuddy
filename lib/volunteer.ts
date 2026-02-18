import { VolunteerSignup, VolunteerSlot } from "@/lib/types";

export const VOLUNTEER_TIMEZONE = "America/Boise";

const boiseDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VOLUNTEER_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const boiseOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VOLUNTEER_TIMEZONE,
  timeZoneName: "shortOffset",
});

export function formatVolunteerSlotTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: VOLUNTEER_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function toBoiseDateTimeInputValue(iso: string) {
  const parts = boiseDateTimeFormatter.formatToParts(new Date(iso));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function boiseOffsetMinutesAt(instant: Date) {
  const parts = boiseOffsetFormatter.formatToParts(instant);
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT-0";
  const match = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

export function boiseInputToIso(input: string) {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const wallClockUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  let correctedUtcMs = wallClockUtcMs;

  for (let i = 0; i < 3; i += 1) {
    const offsetMinutes = boiseOffsetMinutesAt(new Date(correctedUtcMs));
    const nextUtcMs = wallClockUtcMs - offsetMinutes * 60_000;
    if (Math.abs(nextUtcMs - correctedUtcMs) < 60_000) {
      correctedUtcMs = nextUtcMs;
      break;
    }
    correctedUtcMs = nextUtcMs;
  }

  return new Date(correctedUtcMs).toISOString();
}

export function groupSignupsBySlot(signups: VolunteerSignup[]) {
  return signups.reduce<Record<string, VolunteerSignup[]>>((acc, signup) => {
    const list = acc[signup.slot_id] ?? [];
    list.push(signup);
    acc[signup.slot_id] = list;
    return acc;
  }, {});
}

export function sortSlotsChronologically(slots: VolunteerSlot[]) {
  return [...slots].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}
