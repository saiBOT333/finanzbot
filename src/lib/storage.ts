/**
 * Thin localStorage helpers — safe in non-browser environments (SSR, tests
 * before jsdom is initialized) and forgiving on parse errors.
 */

const PROFILE_KEY = "finanzbot:profile";
const moduleKey = (id: string) => `finanzbot:module:${id}`;
export const KEYS = { profile: PROFILE_KEY, moduleKey };

export function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or serialization error — ignore silently for now.
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  profile: unknown;
  modules: Record<string, unknown>;
};

export function buildExport(
  profile: unknown,
  modules: Record<string, unknown>,
): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    modules,
  };
}

export function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && typeof v.exportedAt === "string" && "profile" in v && "modules" in v;
}

export function downloadJSON(filename: string, data: unknown): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
