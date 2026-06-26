// Typed HTTP client for the FastAPI backend (the "kitchen"). See DESIGN.md §1, §5.
// In dev the backend runs as `uvicorn app.main:app`; in production it is the
// Tauri-spawned sidecar. Both bind 127.0.0.1:8008.
import type {
  Job,
  PlayerStateDTO,
  Playlist,
  PlaylistDetail,
  QueueDTO,
  Track,
  TrackDetail,
} from "../types";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

// ── Health / library / tracks ──
export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function getLibrary(params: LibraryParams = {}): Promise<Track[]> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return request<Track[]>(`/library${qs ? `?${qs}` : ""}`);
}

export function getTrack(id: number): Promise<TrackDetail> {
  return request<TrackDetail>(`/tracks/${id}`);
}

export function streamUrl(id: number): string {
  return `${BASE_URL}/stream/${id}`;
}

export function coverUrl(id: number): string {
  return `${BASE_URL}/cover/${id}`;
}

// ── Downloads ──
export interface DownloadRequest {
  query: string;
  format?: string;
  bitrate?: string;
  cookies_from_browser?: string;
  no_lyrics?: boolean;
}

export function startDownload(req: DownloadRequest): Promise<{ job_id: string }> {
  return request<{ job_id: string }>("/download", jsonInit("POST", req));
}

export function getJob(id: string): Promise<Job> {
  return request<Job>(`/jobs/${id}`);
}

export function postHistory(trackId: number): Promise<unknown> {
  return request("/history", jsonInit("POST", { track_id: trackId }));
}

// ── Playlists ──
export function getPlaylists(): Promise<Playlist[]> {
  return request<Playlist[]>("/playlists");
}

export function createPlaylist(name: string, description?: string): Promise<Playlist> {
  return request<Playlist>("/playlists", jsonInit("POST", { name, description }));
}

export function getPlaylist(id: number): Promise<PlaylistDetail> {
  return request<PlaylistDetail>(`/playlists/${id}`);
}

export function renamePlaylist(id: number, name: string): Promise<Playlist> {
  return request<Playlist>(`/playlists/${id}`, jsonInit("PATCH", { name }));
}

export function deletePlaylist(id: number): Promise<void> {
  return request<void>(`/playlists/${id}`, jsonInit("DELETE"));
}

export function addTrackToPlaylist(playlistId: number, trackId: number): Promise<unknown> {
  return request(`/playlists/${playlistId}/tracks`, jsonInit("POST", { track_id: trackId }));
}

export function removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
  return request<void>(`/playlists/${playlistId}/tracks/${trackId}`, jsonInit("DELETE"));
}

export function reorderPlaylist(id: number, orderedTrackIds: number[]): Promise<PlaylistDetail> {
  return request<PlaylistDetail>(
    `/playlists/${id}/order`,
    jsonInit("PUT", { ordered_track_ids: orderedTrackIds }),
  );
}

// ── Favorites ──
export function getFavorites(): Promise<Track[]> {
  return request<Track[]>("/favorites");
}

export function addFavorite(trackId: number): Promise<void> {
  return request<void>(`/favorites/${trackId}`, jsonInit("PUT"));
}

export function removeFavorite(trackId: number): Promise<void> {
  return request<void>(`/favorites/${trackId}`, jsonInit("DELETE"));
}

// ── Queue + player state ──
export function getQueue(): Promise<QueueDTO> {
  return request<QueueDTO>("/queue");
}

export function putQueue(trackIds: number[], currentIndex: number): Promise<QueueDTO> {
  return request<QueueDTO>("/queue", jsonInit("PUT", { track_ids: trackIds, current_index: currentIndex }));
}

export function getPlayerState(): Promise<PlayerStateDTO> {
  return request<PlayerStateDTO>("/player-state");
}

export function putPlayerState(patch: Partial<PlayerStateDTO>): Promise<PlayerStateDTO> {
  return request<PlayerStateDTO>("/player-state", jsonInit("PUT", patch));
}
