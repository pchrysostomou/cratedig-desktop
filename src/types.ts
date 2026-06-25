// Shared domain types mirroring the backend contract (DESIGN.md §6). These grow
// phase by phase; the full library/playlist shapes land with their phases.
export interface Track {
  id: number;
  title: string;
  artists: string[];
  primary_artist: string;
  album: string | null;
  duration_ms: number;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
}
