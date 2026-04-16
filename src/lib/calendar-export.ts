import type { CalendarEventPayload } from "@/lib/mockData";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** HH:MM → HHMMSS for iCal / Google compact form (seconds 00). */
export function compactTimeHm(t: string): string {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return "000000";
  return `${pad2(h)}${pad2(m)}00`;
}

export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function formatUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(event: CalendarEventPayload): string {
  const tz = event.timeZone ?? "America/Chicago";
  const d = event.startDate.replace(/-/g, "");
  const start = `${d}T${compactTimeHm(event.startTime)}`;
  const end = `${d}T${compactTimeHm(event.endTime)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${start}/${end}`,
    details: event.description ?? "",
    location: event.location ?? "",
    ctz: tz,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** `YYYY-MM-DD` + `HH:MM` → `YYYY-MM-DDTHH:mm:00` for Outlook compose. */
function toOutlookLocalDateTime(date: string, time: string): string {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return `${date}T00:00:00`;
  return `${date}T${pad2(h)}:${pad2(m)}:00`;
}

/** Outlook on the web (personal Microsoft account). */
export function buildOutlookLiveUrl(event: CalendarEventPayload): string {
  const base = "https://outlook.live.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name,
    startdt: toOutlookLocalDateTime(event.startDate, event.startTime),
    enddt: toOutlookLocalDateTime(event.startDate, event.endTime),
    body: event.description ?? "",
    location: event.location ?? "",
  });
  return `${base}?${params.toString()}`;
}

/** Microsoft 365 / work Outlook in the browser. */
export function buildOutlookOfficeUrl(event: CalendarEventPayload): string {
  const base = "https://outlook.office.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name,
    startdt: toOutlookLocalDateTime(event.startDate, event.startTime),
    enddt: toOutlookLocalDateTime(event.startDate, event.endTime),
    body: event.description ?? "",
    location: event.location ?? "",
  });
  return `${base}?${params.toString()}`;
}

/** Yahoo Calendar quick-add (local wall time, same as former add-to-calendar-button “Yahoo”). */
export function buildYahooCalendarUrl(event: CalendarEventPayload): string {
  const dateCompact = event.startDate.replace(/-/g, "");
  const st = `${dateCompact}${compactTimeHm(event.startTime)}`;
  const et = `${dateCompact}${compactTimeHm(event.endTime)}`;
  const params = new URLSearchParams({
    v: "60",
    view: "d",
    type: "20",
    title: event.name,
    st,
    et,
    desc: event.description ?? "",
    in_loc: event.location ?? "",
  });
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

export function buildCalendarIcs(event: CalendarEventPayload): string {
  const tz = event.timeZone ?? "America/Chicago";
  const dt = event.startDate.replace(/-/g, "");
  const ds = compactTimeHm(event.startTime);
  const de = compactTimeHm(event.endTime);
  const uid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVRABLE//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@dvrable`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `SUMMARY:${icsEscape(event.name)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
  if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
  lines.push(`DTSTART;TZID=${tz}:${dt}T${ds}`, `DTEND;TZID=${tz}:${dt}T${de}`, "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
