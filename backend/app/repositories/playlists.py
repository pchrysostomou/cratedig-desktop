"""Playlist data access. See DESIGN.md §5.1, §6."""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import Playlist, PlaylistTrack, Track
from app.util import now_ms


def list_playlists(session: Session) -> Sequence[Playlist]:
    return session.exec(select(Playlist).order_by(Playlist.created_at.asc())).all()


def track_counts(session: Session) -> dict[int, int]:
    rows = session.exec(
        select(PlaylistTrack.playlist_id, func.count()).group_by(PlaylistTrack.playlist_id)
    ).all()
    return {playlist_id: count for playlist_id, count in rows}


def create_playlist(session: Session, name: str, description: str | None = None) -> Playlist:
    playlist = Playlist(name=name, description=description)
    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    return playlist


def get_playlist(session: Session, playlist_id: int) -> Playlist | None:
    return session.get(Playlist, playlist_id)


def update_playlist(
    session: Session, playlist_id: int, *, name: str | None = None, description: str | None = None
) -> Playlist | None:
    playlist = session.get(Playlist, playlist_id)
    if playlist is None:
        return None
    if name is not None:
        playlist.name = name
    if description is not None:
        playlist.description = description
    playlist.updated_at = now_ms()
    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    return playlist


def delete_playlist(session: Session, playlist_id: int) -> bool:
    playlist = session.get(Playlist, playlist_id)
    if playlist is None:
        return False
    session.delete(playlist)  # playlist_tracks rows cascade (DESIGN §6)
    session.commit()
    return True


def get_playlist_tracks(session: Session, playlist_id: int) -> Sequence[Track]:
    stmt = (
        select(Track)
        .join(PlaylistTrack, PlaylistTrack.track_id == Track.id)
        .where(PlaylistTrack.playlist_id == playlist_id)
        .order_by(PlaylistTrack.position.asc())
    )
    return session.exec(stmt).all()


def add_track(
    session: Session, playlist_id: int, track_id: int, position: int | None = None
) -> str:
    """Return 'added', 'duplicate', or 'missing' (playlist/track not found)."""
    if session.get(Playlist, playlist_id) is None or session.get(Track, track_id) is None:
        return "missing"
    existing = session.exec(
        select(PlaylistTrack).where(
            PlaylistTrack.playlist_id == playlist_id, PlaylistTrack.track_id == track_id
        )
    ).first()
    if existing is not None:
        return "duplicate"  # v1: UNIQUE(playlist_id, track_id)
    if position is None:
        max_pos = session.exec(
            select(func.max(PlaylistTrack.position)).where(
                PlaylistTrack.playlist_id == playlist_id
            )
        ).one()
        position = 0 if max_pos is None else max_pos + 1
    session.add(PlaylistTrack(playlist_id=playlist_id, track_id=track_id, position=position))
    _touch(session, playlist_id)
    session.commit()
    return "added"


def remove_track(session: Session, playlist_id: int, track_id: int) -> bool:
    row = session.exec(
        select(PlaylistTrack).where(
            PlaylistTrack.playlist_id == playlist_id, PlaylistTrack.track_id == track_id
        )
    ).first()
    if row is None:
        return False
    session.delete(row)
    _touch(session, playlist_id)
    session.commit()
    return True


def reorder(session: Session, playlist_id: int, ordered_track_ids: list[int]) -> bool:
    if session.get(Playlist, playlist_id) is None:
        return False
    rows = {
        pt.track_id: pt
        for pt in session.exec(
            select(PlaylistTrack).where(PlaylistTrack.playlist_id == playlist_id)
        ).all()
    }
    for index, track_id in enumerate(ordered_track_ids):
        row = rows.get(track_id)
        if row is not None:
            row.position = index
            session.add(row)
    _touch(session, playlist_id)
    session.commit()
    return True


def _touch(session: Session, playlist_id: int) -> None:
    playlist = session.get(Playlist, playlist_id)
    if playlist is not None:
        playlist.updated_at = now_ms()
        session.add(playlist)
