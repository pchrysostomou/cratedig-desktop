// Shared domain types mirroring the backend contract (DESIGN.md §5, §6).

export interface Track {
  id: number;
  source_id: string;
  title: string;
  artists: string[];
  primary_artist: string;
  album: string | null;
  isrc: string | null;
  duration_ms: number;
  track_number: number;
  disc_number: number;
  release_year: string | null;
  cover_art_url: string | null;
  file_format: string | null;
  youtube_url: string | null;
  play_count: number;
  added_at: number;
  last_played_at: number | null;
  is_favorite: boolean;
}

export interface TrackDetail extends Track {
  lyrics: string | null;
  playlist_ids: number[];
}

export type JobStatus = "queued" | "running" | "done" | "error";

export interface Job {
  id: string;
  query: string;
  status: JobStatus;
  done: number;
  total: number;
  error: string | null;
  track_ids: number[];
  results_summary: Record<string, number> | null;
  created_at: number;
  finished_at: number | null;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  track_count: number;
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[];
}

export type RepeatMode = "off" | "all" | "one";

export interface PlayerStateDTO {
  current_index: number;
  is_playing: boolean;
  repeat_mode: RepeatMode;
  shuffle: boolean;
  volume: number; // 0-100
  position_ms: number;
}

export interface QueueDTO {
  items: Track[];
  current_index: number;
}
