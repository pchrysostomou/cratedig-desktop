"""API request/response models. See DESIGN.md §5.

``TrackRead`` is the list-row shape (no lyrics, for weight); ``TrackDetail`` adds
lyrics + playlist_ids. Both carry ``is_favorite`` so the API contract is stable
from Phase 1 — populated for real once favorites/playlists land (DESIGN §9 Ph5).
Local filesystem fields (file_path, cover_path, file_size) are intentionally NOT
exposed; the UI reaches audio/art via /stream/{id} and /cover/{id}.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class SortField(str, Enum):
    """Whitelisted sort columns (prevents sort-param injection, DESIGN §5)."""

    added_at = "added_at"
    title = "title"
    primary_artist = "primary_artist"
    album = "album"
    duration_ms = "duration_ms"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class TrackRead(BaseModel):
    id: int
    source_id: str
    title: str
    artists: list[str]
    primary_artist: str
    album: str | None
    isrc: str | None
    duration_ms: int
    track_number: int
    disc_number: int
    release_year: str | None
    cover_art_url: str | None
    file_format: str | None
    youtube_url: str | None
    play_count: int
    added_at: int
    last_played_at: int | None
    is_favorite: bool = False


class TrackDetail(TrackRead):
    lyrics: str | None = None
    playlist_ids: list[int] = []
