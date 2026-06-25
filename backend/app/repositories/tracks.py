"""Track data access. See DESIGN.md §5, §6.

Repositories return ORM ``Track`` rows; the router maps them to response schemas.
``create_track`` is used by tests to seed and by Phase 2 to persist downloads.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import String, cast, func, or_
from sqlmodel import Session, select

from app.models import Favorite, PlaylistTrack, Track
from app.schemas import SortField, SortOrder

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
