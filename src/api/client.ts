// Typed HTTP client for the FastAPI backend (the "kitchen"). See DESIGN.md §1, §5.
// In dev the backend runs as `uvicorn app.main:app`; in production it is the
// Tauri-spawned sidecar. Both bind 127.0.0.1:8008.
export const BASE_URL = "http://127.0.0.1:8008";

export interface HealthResponse {
  status: string;
  version: string;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/health");
}
