"""Track data access. See DESIGN.md §5, §6.

Repositories return ORM ``Track`` rows; the router maps them to response schemas.
``create_track`` is used by tests to seed and by Phase 2 to persist downloads.
"""

from __future__ import annotations

import os
from collections.abc import Sequence

from cratedig.models import DownloadResult, ResultStatus
from sqlalchemy import String, cast, func, or_
from sqlmodel import Session, select

from app.audio_meta import read_duration_ms
from app.models import Favorite, PlaylistTrack, Track
from app.schemas import SortField, SortOrder, TrackRead

_SORT_COLUMNS = {
    SortField.added_at: Track.added_at,
    SortField.title: Track.title,
    SortField.primary_artist: Track.primary_artist,
    SortField.album: Track.album,
    SortField.duration_ms: Track.duration_ms,
}


def create_track(session: Session, **fields: object) -> Track:
    track = Track(**fields)
    session.add(track)
    session.commit()
    session.refresh(track)
    return track


def get_track(session: Session, track_id: int) -> Track | None:
    return session.get(Track, track_id)


def list_tracks(
    session: Session,
    *,
    q: str | None = None,
    sort: SortField = SortField.added_at,
    order: SortOrder = SortOrder.desc,
    limit: int = 100,
    offset: int = 0,
) -> Sequence[Track]:
    stmt = select(Track)
    if q:
        like = f"%{q.lower()}%"
        # Match title, album, and ANY artist. artists is a JSON column; casting it
        # to text lets a featured/secondary artist be found too (primary_artist is a
        # subset of it). Good enough for Phase 1; FTS is a later enhancement (§5.1).
        stmt = stmt.where(
            or_(
                func.lower(Track.title).like(like),
                func.lower(Track.album).like(like),
                func.lower(cast(Track.artists, String)).like(like),
            )
        )
    column = _SORT_COLUMNS[sort]
    stmt = stmt.order_by(column.desc() if order == SortOrder.desc else column.asc())
    stmt = stmt.offset(offset).limit(limit)
    return session.exec(stmt).all()


def favorite_ids(session: Session, track_ids: Sequence[int]) -> set[int]:
    """Subset of ``track_ids`` that are favorited (empty until Phase 5 populates it)."""
    if not track_ids:
        return set()
    stmt = select(Favorite.track_id).where(Favorite.track_id.in_(list(track_ids)))
    return set(session.exec(stmt).all())


def playlist_ids_for(session: Session, track_id: int) -> list[int]:
    """Playlists a track belongs to (empty until Phase 5 populates it)."""
    stmt = select(PlaylistTrack.playlist_id).where(PlaylistTrack.track_id == track_id)
    return list(session.exec(stmt).all())


def to_read(track: Track, is_favorite: bool) -> TrackRead:
    # model_dump() carries extra columns (file_path, lyrics, ...); TrackRead ignores them.
    return TrackRead(**track.model_dump(), is_favorite=is_favorite)


def to_reads(session: Session, tracks: Sequence[Track]) -> list[TrackRead]:
    """Enrich a list of tracks with is_favorite in a single favorites query."""
    favorites = favorite_ids(session, [t.id for t in tracks])
    return [to_read(t, t.id in favorites) for t in tracks]


def get_by_file_path(session: Session, file_path: str) -> Track | None:
    return session.exec(select(Track).where(Track.file_path == file_path)).first()


def save_download_result(session: Session, result: DownloadResult) -> Track | None:
    """Upsert a cratedig DownloadResult into the tracks table (idempotent by file_path).

    Only SUCCESS/SKIPPED results with an output_path are persisted; NOT_FOUND/FAILED
    are ignored. Returns the stored Track, or None if nothing was persisted.
    """
    if result.status not in (ResultStatus.SUCCESS, ResultStatus.SKIPPED):
        return None
    if not result.output_path:
        return None

    src = result.track
    try:
        file_size: int | None = os.path.getsize(result.output_path)
    except OSError:
        file_size = None
    ext = os.path.splitext(result.output_path)[1].lstrip(".").lower() or None

    # Backfill duration when the metadata source gave 0 (DESIGN §9 Phase 4): the file
    # is on local disk now, so read its real length from the header.
    duration_ms = src.duration_ms
    if not duration_ms:
        duration_ms = read_duration_ms(result.output_path) or 0

    fields = dict(
        source_id=src.source_id,
        title=src.title,
        artists=list(src.artists),
        primary_artist=src.primary_artist,
        album=src.album,
        isrc=src.isrc,
        duration_ms=duration_ms,
        track_number=src.track_number,
        disc_number=src.disc_number,
        release_year=src.release_year,
        cover_art_url=src.cover_art_url,
        lyrics=src.lyrics,
        file_path=result.output_path,
        file_format=ext,
        file_size=file_size,
        youtube_url=result.youtube_url,
    )

    existing = get_by_file_path(session, result.output_path)
    track = existing or Track(**fields)
    if existing is not None:  # update in place (preserves id / added_at / play_count)
        for key, value in fields.items():
            setattr(track, key, value)
    session.add(track)
    session.commit()
    session.refresh(track)
    return track
