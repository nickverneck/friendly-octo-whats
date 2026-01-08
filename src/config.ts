import { readFileSync } from "node:fs";
import * as TOML from "@iarna/toml";

export interface Config {
  calendar: {
    id: string;
    timezone: string;
    title_filters: string[];
  };
  templates: Record<string, string>;
  groupname: {
    regex: string;
    flags: string;
    capture_group: number;
  };
  sheets: {
    id: string;
    range: string;
    group_name_header: string;
    group_id_header: string;
    header_row: number;
  };
  wassenger: {
    api_base: string;
    send_endpoint: string;
    groups_endpoint: string;
    device_id?: string;
  };
  webhook: {
    path: string;
    port: number;
  };
  state: {
    path: string;
  };
}

type TomlValue = unknown;

function asString(value: TomlValue | undefined, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Config ${path} must be a non-empty string.`);
  }
  return value;
}

function asNumber(value: TomlValue | undefined, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Config ${path} must be a number.`);
  }
  return value;
}

function asStringArray(value: TomlValue | undefined, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Config ${path} must be an array of strings.`);
  }
  const arr = value.filter((item) => typeof item === "string") as string[];
  if (arr.length !== value.length) {
    throw new Error(`Config ${path} must contain only strings.`);
  }
  return arr;
}

function asRecordOfStrings(value: TomlValue | undefined, path: string): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Config ${path} must be a table of string values.`);
  }
  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      throw new Error(`Config ${path}.${key} must be a string.`);
    }
    record[key] = entry;
  }
  return record;
}

export function loadConfig(): Config {
  const configPath = Bun.env.CONFIG_PATH ?? "config.toml";
  const raw = readFileSync(configPath, "utf8");
  const parsed = TOML.parse(raw) as Record<string, unknown>;

  const templates = asRecordOfStrings(parsed.templates, "templates");
  const calendarTable = parsed.calendar as Record<string, unknown> | undefined;
  const groupTable = parsed.groupname as Record<string, unknown> | undefined;
  const sheetsTable = parsed.sheets as Record<string, unknown> | undefined;
  const wassengerTable = parsed.wassenger as Record<string, unknown> | undefined;
  const webhookTable = parsed.webhook as Record<string, unknown> | undefined;
  const stateTable = parsed.state as Record<string, unknown> | undefined;

  if (!calendarTable) {
    throw new Error("Config calendar table is required.");
  }
  if (!groupTable) {
    throw new Error("Config groupname table is required.");
  }
  if (!sheetsTable) {
    throw new Error("Config sheets table is required.");
  }
  if (!wassengerTable) {
    throw new Error("Config wassenger table is required.");
  }

  const calendarTitleFilters = calendarTable.title_filters
    ? asStringArray(calendarTable.title_filters, "calendar.title_filters")
    : Object.keys(templates);

  if (calendarTitleFilters.length === 0) {
    throw new Error("At least one calendar title filter or template entry is required.");
  }

  return {
    calendar: {
      id: asString(calendarTable.id, "calendar.id"),
      timezone: calendarTable.timezone ? asString(calendarTable.timezone, "calendar.timezone") : "America/New_York",
      title_filters: calendarTitleFilters,
    },
    templates,
    groupname: {
      regex: asString(groupTable.regex, "groupname.regex"),
      flags: groupTable.flags ? asString(groupTable.flags, "groupname.flags") : "i",
      capture_group: groupTable.capture_group
        ? asNumber(groupTable.capture_group, "groupname.capture_group")
        : 1,
    },
    sheets: {
      id: asString(sheetsTable.id, "sheets.id"),
      range: asString(sheetsTable.range, "sheets.range"),
      group_name_header: asString(sheetsTable.group_name_header, "sheets.group_name_header"),
      group_id_header: asString(sheetsTable.group_id_header, "sheets.group_id_header"),
      header_row: sheetsTable.header_row ? asNumber(sheetsTable.header_row, "sheets.header_row") : 1,
    },
    wassenger: {
      api_base: wassengerTable.api_base
        ? asString(wassengerTable.api_base, "wassenger.api_base")
        : "https://api.wassenger.com/v1",
      send_endpoint: wassengerTable.send_endpoint
        ? asString(wassengerTable.send_endpoint, "wassenger.send_endpoint")
        : "/messages",
      groups_endpoint: wassengerTable.groups_endpoint
        ? asString(wassengerTable.groups_endpoint, "wassenger.groups_endpoint")
        : "/devices/{deviceId}/groups",
      device_id: wassengerTable.device_id ? asString(wassengerTable.device_id, "wassenger.device_id") : undefined,
    },
    webhook: {
      path: webhookTable?.path ? asString(webhookTable.path, "webhook.path") : "/webhook",
      port: webhookTable?.port ? asNumber(webhookTable.port, "webhook.port") : 3000,
    },
    state: {
      path: stateTable?.path ? asString(stateTable.path, "state.path") : ".state/processed-events.json",
    },
  };
}
