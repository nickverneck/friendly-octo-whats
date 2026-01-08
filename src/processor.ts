import { DateTime } from "luxon";
import { Config } from "./config";
import { listTodaysMatchedEvents, extractGroupName } from "./calendar";
import { getCalendarClient, getSheetsClient } from "./google";
import { getSheetData, findGroupIdByName, getLatestNonEmptyRow, updateSheetCell, getHeaderIndex } from "./sheets";
import { log } from "./log";
import { loadState, saveState, pruneState, isProcessed, markProcessed } from "./state";
import { listWassengerGroups, sendWassengerGroupMessage, extractGroupId, extractGroupName as getGroupLabel } from "./wassenger";
import { renderTemplate } from "./templates";

function dateKeyForTimezone(timezone: string): string {
  return DateTime.now().setZone(timezone).toISODate() ?? new Date().toISOString().slice(0, 10);
}

export async function runDailyProcessing(config: Config): Promise<void> {
  const calendar = getCalendarClient();
  const sheets = getSheetsClient();
  const todayKey = dateKeyForTimezone(config.calendar.timezone);

  const state = await loadState(config.state.path);
  pruneState(state, todayKey);

  const events = await listTodaysMatchedEvents(calendar, config);
  if (events.length === 0) {
    log.info("No matching events for today.");
    await saveState(config.state.path, state);
    return;
  }

  const sheetData = await getSheetData(sheets, config);

  for (const event of events) {
    if (isProcessed(state, event.id, todayKey)) {
      continue;
    }
    const groupName = extractGroupName(event.description, config);
    if (!groupName) {
      log.warn(`Event ${event.id} missing group name in description.`);
      continue;
    }
    const groupId = findGroupIdByName(sheetData, config, groupName);
    if (!groupId) {
      log.warn(`Group ID not found for group name '${groupName}'.`);
      continue;
    }
    const template = config.templates[event.matchedTitle];
    if (!template) {
      log.warn(`No template configured for title '${event.matchedTitle}'.`);
      continue;
    }
    const message = renderTemplate(template, { groupname: groupName, event });
    try {
      await sendWassengerGroupMessage(config, groupId, message);
      markProcessed(state, event.id, todayKey);
      log.info(`Sent message for event ${event.id} to group ${groupId}.`);
    } catch (error) {
      log.error(`Failed to send message for event ${event.id}.`, error);
    }
  }

  await saveState(config.state.path, state);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function handleWebhook(config: Config): Promise<void> {
  const sheets = getSheetsClient();
  const sheetData = await getSheetData(sheets, config);
  const latest = getLatestNonEmptyRow(sheetData, config.sheets.header_row);
  if (!latest) {
    log.warn("No non-empty rows found in sheet.");
    return;
  }

  const headers = sheetData.headers;
  const groupNameIndex = getHeaderIndex(headers, config.sheets.group_name_header);
  const groupName = latest.row[groupNameIndex] ?? "";
  if (!groupName.trim()) {
    log.warn("Latest row is missing group name.");
    return;
  }

  const groups = await listWassengerGroups(config);
  const match = groups.find((group) => {
    const label = getGroupLabel(group);
    if (!label) return false;
    return normalize(label) === normalize(groupName);
  });

  if (!match) {
    log.warn(`No Wassenger group matched '${groupName}'.`);
    return;
  }

  const groupId = extractGroupId(match);
  if (!groupId) {
    log.warn(`Matched group '${groupName}' missing id.`);
    return;
  }

  const rowNumber = latest.rowNumber;
  await updateSheetCell(sheets, config, rowNumber, config.sheets.group_id_header, groupId);
  log.info(`Updated row ${rowNumber} with group id ${groupId}.`);
}
