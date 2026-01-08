import { Config } from "./config";
import { getEnv } from "./env";

function buildUrl(base: string, endpoint: string): string {
  return new URL(endpoint, base).toString();
}

function resolveDeviceId(config: Config): string {
  const env = getEnv();
  return config.wassenger.device_id ?? env.wassengerDeviceId;
}

function expandDeviceEndpoint(endpoint: string, deviceId: string): string {
  return endpoint.replace("{deviceId}", deviceId);
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wassenger request failed ${response.status}: ${text}`);
  }
  return response.json();
}

function toGroupArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const data = (payload as Record<string, unknown>).data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    const results = (payload as Record<string, unknown>).results;
    if (Array.isArray(results)) return results as Record<string, unknown>[];
  }
  return [];
}

export async function listWassengerGroups(config: Config): Promise<Record<string, unknown>[]> {
  const env = getEnv();
  const deviceId = resolveDeviceId(config);
  if (!deviceId) {
    throw new Error("Missing Wassenger device ID. Set wassenger.device_id or WASSENGER_DEVICE_ID.");
  }
  const endpoint = expandDeviceEndpoint(config.wassenger.groups_endpoint, deviceId);
  const url = buildUrl(config.wassenger.api_base, endpoint);
  const payload = await requestJson(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Token: env.wassengerApiToken,
    },
  });
  return toGroupArray(payload);
}

export async function sendWassengerGroupMessage(
  config: Config,
  groupId: string,
  message: string
): Promise<void> {
  const env = getEnv();
  const url = buildUrl(config.wassenger.api_base, config.wassenger.send_endpoint);
  await requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Token: env.wassengerApiToken,
    },
    body: JSON.stringify({
      group: groupId,
      message,
    }),
  });
}

export function extractGroupId(group: Record<string, unknown>): string | null {
  const candidates = [group.id, group.wid, group.group, group.uid];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

export function extractGroupName(group: Record<string, unknown>): string | null {
  const candidates = [group.name, group.subject, group.title];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}
