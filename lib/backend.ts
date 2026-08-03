import type { AppData } from "@/types";

export type RuntimeConfig = {
  backendEnabled: boolean;
  appsScriptUrl: string;
  geminiEnabled: boolean;
  dataMode: "training" | "live" | string;
};

const defaultConfig: RuntimeConfig = {
  backendEnabled: false,
  appsScriptUrl: "",
  geminiEnabled: false,
  dataMode: "training"
};

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const response = await fetch(`${basePath}/runtime-config.json`, { cache: "no-store" });
    if (!response.ok) return defaultConfig;
    const config = await response.json();
    return { ...defaultConfig, ...config };
  } catch {
    return defaultConfig;
  }
}

export async function loadRemoteData(config: RuntimeConfig): Promise<AppData | null> {
  if (!config.backendEnabled || !config.appsScriptUrl) return null;
  const url = new URL(config.appsScriptUrl);
  url.searchParams.set("action", "loadAll");
  url.searchParams.set("ts", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Backend load failed: ${response.status}`);
  const payload = await response.json();
  if (!payload?.ok) throw new Error(payload?.error || "Backend load failed");
  return payload.data as AppData;
}

export async function saveRemoteData(config: RuntimeConfig, data: AppData): Promise<void> {
  if (!config.backendEnabled || !config.appsScriptUrl) return;
  await post(config.appsScriptUrl, { action: "saveAll", data, user: "GitHub Pages Demo" });
}

export async function clearRemoteData(config: RuntimeConfig): Promise<void> {
  if (!config.backendEnabled || !config.appsScriptUrl) return;
  await post(config.appsScriptUrl, { action: "clearAll", user: "GitHub Pages Demo" });
}

export async function askGemini(
  config: RuntimeConfig,
  question: string,
  data: AppData
): Promise<string | null> {
  if (!config.backendEnabled || !config.geminiEnabled || !config.appsScriptUrl) return null;
  const payload = await post(config.appsScriptUrl, {
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

async function post(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Backend request failed: ${response.status}`);
  const payload = await response.json();
  if (!payload?.ok) throw new Error(payload?.error || "Backend request failed");
  return payload;
}
