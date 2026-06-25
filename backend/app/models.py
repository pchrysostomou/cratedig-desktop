"""SQLModel tables — the full library schema. See DESIGN.md §6.

Only ``tracks`` is read in Phase 1; the other tables are created now so the schema
is complete from the start (DESIGN §9) and later phases avoid migrations.
Timestamps are epoch-millis integers. ``Track.artists`` is a JSON column mirroring
cratedig's ``Track.artists: list[str]``. Foreign keys cascade on delete (which
requires the SQLite ``foreign_keys`` pragma, enabled in app/db.py).
"""

from __future__ import annotations

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.util import now_ms


class Track(SQLModel, table=True):
    __tablename__ = "tracks"

    id: int | None = Field(default=None, primary_key=True)
    source_id: str = Field(index=True)  # MusicBrainz MBID (cratedig Track.source_id)
    title: str
    artists: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    primary_artist: str = Field(index=True)  # denormalised for sort/display
    album: str | None = None
    isrc: str | None = None
    duration_ms: int = 0
    track_number: int = 1
    disc_number: int = 1
    release_year: str | None = None
    cover_art_url: str | None = None
    cover_path: str | None = None
    lyrics: str | None = None
    file_path: str = Field(index=True, unique=True)  # DownloadResult.output_path
    file_format: str | None = None
    file_size: int | None = None
    youtube_url: str | None = None
    play_count: int = 0
    added_at: int = Field(default_factory=now_ms, index=True)
    last_played_at: int | None = None


class Playlist(SQLModel, table=True):
    __tablename__ = "playlists"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None
    created_at: int = Field(default_factory=now_ms)
    updated_at: int = Field(default_factory=now_ms)


class PlaylistTrack(SQLModel, table=True):
    __tablename__ = "playlist_tracks"
    __table_args__ = (UniqueConstraint("playlist_id", "track_id", name="uq_playlist_track"),)

    id: int | None = Field(default=None, primary_key=True)
    playlist_id: int = Field(foreign_key="playlists.id", ondelete="CASCADE", index=True)
    track_id: int = Field(foreign_key="tracks.id", ondelete="CASCADE", index=True)
    position: int  # order within the playlist
    added_at: int = Field(default_factory=now_ms)


class Favorite(SQLModel, table=True):
    __tablename__ = "favorites"

    track_id: int = Field(foreign_key="tracks.id", ondelete="CASCADE", primary_key=True)
    created_at: int = Field(default_factory=now_ms)


class QueueItem(SQLModel, table=True):
    __tablename__ = "queue"

    id: int | None = Field(default=None, primary_key=True)
    position: int = Field(index=True)  # play order
    track_id: int = Field(foreign_key="tracks.id", ondelete="CASCADE")


class PlayHistory(SQLModel, table=True):
    __tablename__ = "play_history"

    id: int | None = Field(default=None, primary_key=True)
    track_id: int = Field(foreign_key="tracks.id", ondelete="CASCADE", index=True)
    played_at: int = Field(default_factory=now_ms, index=True)
    ms_played: int | None = None


class PlayerState(SQLModel, table=True):
    __tablename__ = "player_state"

    id: int | None = Field(default=1, primary_key=True)  # singleton row (id == 1)
    current_index: int = 0
    is_playing: int = 0
    repeat_mode: str = "off"  # off | all | one
    shuffle: int = 0
    volume: int = 100
    position_ms: int = 0


class DownloadJob(SQLModel, table=True):
    __tablename__ = "download_jobs"

    id: str = Field(primary_key=True)  # uuid
    query: str
    status: str = "queued"  # queued | running | done | error
    total: int = 0
    done: int = 0
    error: str | None = None
    created_at: int = Field(default_factory=now_ms)
    finished_at: int | None = None
