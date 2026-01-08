import { DateTime } from "luxon";
import type { calendar_v3 } from "googleapis";
import { Config } from "./config";

export interface MatchedEvent {
  id: string;
  summary: string;
  description: string;
  start: string | null;
  end: string | null;
  matchedTitle: string;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function matchesTitle(summary: string, titles: string[]): string | null {
  const normalizedSummary = normalize(summary);
  for (const title of titles) {
    if (normalizedSummary.includes(normalize(title))) {
      return title;
    }
  }
  return null;
}

function toEventDateString(event: calendar_v3.Schema$EventDateTime | undefined): string | null {
  if (!event) return null;
  return event.dateTime ?? event.date ?? null;
}

export async function listTodaysMatchedEvents(
  calendar: calendar_v3.Calendar,
  config: Config
): Promise<MatchedEvent[]> {
  const now = DateTime.now().setZone(config.calendar.timezone);
  const startOfDay = now.startOf("day");
  const endOfDay = startOfDay.plus({ days: 1 });

  const response = await calendar.events.list({
    calendarId: config.calendar.id,
    timeMin: startOfDay.toISO(),
    timeMax: endOfDay.toISO(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items ?? [];
  const matched: MatchedEvent[] = [];

  for (const event of events) {
    const summary = event.summary ?? "";
    const matchedTitle = matchesTitle(summary, config.calendar.title_filters);
    if (!matchedTitle) continue;
    matched.push({
      id: event.id ?? `${summary}-${event.start?.dateTime ?? event.start?.date ?? "unknown"}`,
      summary,
      description: event.description ?? "",
      start: toEventDateString(event.start),
      end: toEventDateString(event.end),
      matchedTitle,
    });
  }

  return matched;
}

export function extractGroupName(description: string, config: Config): string | null {
  const regex = new RegExp(config.groupname.regex, config.groupname.flags);
  const match = description.match(regex);
  if (!match) return null;
  const groupIndex = Math.max(0, Math.min(match.length - 1, config.groupname.capture_group));
  const value = match[groupIndex] ?? "";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
