import { promises as fs } from "node:fs";
import { dirname } from "node:path";

export interface State {
  processed: Record<string, string>;
}

const emptyState: State = { processed: {} };

export async function loadState(path: string): Promise<State> {
  try {
    const raw = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(raw) as State;
    if (!parsed || typeof parsed !== "object" || !parsed.processed) {
      return structuredClone(emptyState);
    }
    return parsed;
  } catch {
    return structuredClone(emptyState);
  }
}

export async function saveState(path: string, state: State): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, JSON.stringify(state, null, 2));
}

export function pruneState(state: State, dateKey: string) {
  const entries = Object.entries(state.processed);
  for (const [eventId, date] of entries) {
    if (date !== dateKey) {
      delete state.processed[eventId];
    }
  }
}

export function isProcessed(state: State, eventId: string, dateKey: string): boolean {
  return state.processed[eventId] === dateKey;
}

export function markProcessed(state: State, eventId: string, dateKey: string) {
  state.processed[eventId] = dateKey;
}
