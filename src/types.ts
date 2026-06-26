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
