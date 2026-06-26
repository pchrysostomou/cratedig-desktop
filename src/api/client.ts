// Typed HTTP client for the FastAPI backend (the "kitchen"). See DESIGN.md §1, §5.
// In dev the backend runs as `uvicorn app.main:app`; in production it is the
// Tauri-spawned sidecar. Both bind 127.0.0.1:8008.
import type { Job, Track, TrackDetail } from "../types";

export const BASE_URL = "http://127.0.0.1:8008";

export interface HealthResponse {
  status: string;
  version: string;
}

export type SortField = "added_at" | "title" | "primary_artist" | "album" | "duration_ms";
export type SortOrder = "asc" | "desc";

export interface LibraryParams {
  q?: string;
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
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

export function getLibrary(params: LibraryParams = {}): Promise<Track[]> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return getJson<Track[]>(`/library${qs ? `?${qs}` : ""}`);
}

export function getTrack(id: number): Promise<TrackDetail> {
  return getJson<TrackDetail>(`/tracks/${id}`);
}

export function streamUrl(id: number): string {
  return `${BASE_URL}/stream/${id}`;
}

export function coverUrl(id: number): string {
  return `${BASE_URL}/cover/${id}`;
}

export interface DownloadRequest {
  query: string;
  format?: string;
  bitrate?: string;
  cookies_from_browser?: string;
  no_lyrics?: boolean;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return getJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function startDownload(req: DownloadRequest): Promise<{ job_id: string }> {
  return postJson<{ job_id: string }>("/download", req);
}

export function getJob(id: string): Promise<Job> {
  return getJson<Job>(`/jobs/${id}`);
}

export function postHistory(trackId: number): Promise<unknown> {
  return postJson("/history", { track_id: trackId });
}
