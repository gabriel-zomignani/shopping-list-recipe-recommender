import { isRecipeHistorySessionArray } from "@/lib/storage/schemas";
import { readVersionedStorage, writeVersionedStorage } from "@/lib/storage/versioned";
import type { RecipeHistorySession } from "@/types/history";

const HISTORY_STORAGE_KEY = "recipe-history-sessions";
const HISTORY_LIMIT = 30;

export function readHistorySessions(): RecipeHistorySession[] {
  return readVersionedStorage(HISTORY_STORAGE_KEY, isRecipeHistorySessionArray, []);
}

export function writeHistorySessions(sessions: RecipeHistorySession[]) {
  writeVersionedStorage(HISTORY_STORAGE_KEY, sessions.slice(0, HISTORY_LIMIT));
}

export function saveHistorySession(session: RecipeHistorySession) {
  const current = readHistorySessions();
  const next = [session, ...current.filter((item) => item.id !== session.id)];
  writeHistorySessions(next);
  return next.slice(0, HISTORY_LIMIT);
}

export function deleteHistorySession(id: string) {
  const next = readHistorySessions().filter((item) => item.id !== id);
  writeHistorySessions(next);
  return next;
}

export function getHistorySession(id: string) {
  return readHistorySessions().find((item) => item.id === id);
}
