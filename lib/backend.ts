import type { AppData } from "@/types";
import type { SuggestionInput } from "@/types/workflow";

export type RuntimeConfig = {
  backendEnabled: boolean;
  appsScriptUrl: string;
  geminiEnabled: boolean;
  dataMode: "training" | "live" | "shared" | string;
};

export type SaveResult = "confirmed" | "submitted";

const defaultConfig: RuntimeConfig = {
  backendEnabled: false,
  appsScriptUrl: "",
  geminiEnabled: false,
  dataMode: "training"
};

const REQUEST_TIMEOUT_MS = 15000;

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const response = await fetch(`${basePath}/runtime-config.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return defaultConfig;
    const config = await response.json();
    return { ...defaultConfig, ...config };
  } catch {
    return defaultConfig;
  }
}

export async function checkBackendReachable(config: RuntimeConfig): Promise<boolean> {
  if (!config.backendEnabled || !config.appsScriptUrl || typeof window === "undefined") return false;
  const url = buildUrl(config.appsScriptUrl, { action: "health", ts: String(Date.now()) });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function loadRemoteData(config: RuntimeConfig): Promise<AppData | null> {
  if (!config.backendEnabled || !config.appsScriptUrl) return null;
  const url = buildUrl(config.appsScriptUrl, { action: "loadAll", ts: String(Date.now()) });
  const payload = await getReadableJson(url);
  if (!payload?.ok) throw new Error(payload?.error || "Backend load failed");
  return payload.data as AppData;
}

export async function saveRemoteData(config: RuntimeConfig, data: AppData): Promise<SaveResult> {
  if (!config.backendEnabled || !config.appsScriptUrl) return "submitted";
  const result = await postWithOpaqueFallback(config.appsScriptUrl, {
    action: "saveAll",
    data,
    user: "Timetable platform"
  });
  return result.opaque ? "submitted" : "confirmed";
}

export async function clearRemoteData(config: RuntimeConfig): Promise<SaveResult> {
  if (!config.backendEnabled || !config.appsScriptUrl) return "submitted";
  const result = await postWithOpaqueFallback(config.appsScriptUrl, {
    action: "clearAll",
    user: "Timetable platform"
  });
  return result.opaque ? "submitted" : "confirmed";
}

export async function submitSuggestion(config: RuntimeConfig, suggestion: SuggestionInput) {
  if (!config.backendEnabled || !config.appsScriptUrl) throw new Error("The feedback service is not connected.");

  const submittedAt = new Date().toISOString();
  const result = await postWithOpaqueFallback(config.appsScriptUrl, {
    action: "submitSuggestion",
    suggestion: {
      ...suggestion,
      submittedAt,
      source: "GitHub Pages pilot"
    }
  });

  if (!result.opaque && result.payload?.data) {
    return result.payload.data as { suggestionId: string; submittedAt: string };
  }

  return {
    suggestionId: createClientReference(),
    submittedAt
  };
}

export async function askGemini(
  config: RuntimeConfig,
  question: string,
  data: AppData
): Promise<string | null> {
  if (!config.backendEnabled || !config.geminiEnabled || !config.appsScriptUrl) return null;

  const payload = await postReadable(config.appsScriptUrl, {
    action: "askGemini",
    question,
    context: {
      rooms: data.rooms,
      lecturers: data.lecturers,
      studentGroups: data.studentGroups,
      modules: data.modules,
      sessions: data.sessions,
      conflicts: data.conflicts,
      requirements: data.requirements,
      generatedAt: data.generatedAt
    }
  });

  return payload?.answer || null;
}

async function getReadableJson(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Backend load failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function postReadable(url: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Backend request failed: ${response.status}`);
    const payload = await response.json();
    if (!payload?.ok) throw new Error(payload?.error || "Backend request failed");
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function postWithOpaqueFallback(url: string, body: Record<string, unknown>) {
  try {
    const payload = await postReadable(url, body);
    return { opaque: false as const, payload };
  } catch (readableError) {
    if (typeof window === "undefined") throw readableError;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        redirect: "follow",
        signal: controller.signal
      });
      return { opaque: true as const, payload: null };
    } catch {
      throw readableError;
    } finally {
      window.clearTimeout(timer);
    }
  }
}

function buildUrl(baseUrl: string, parameters: Record<string, string>) {
  const url = new URL(baseUrl);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function createClientReference() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ].join("");
  return `SUG-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
