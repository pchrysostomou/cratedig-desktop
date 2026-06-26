"""Favorites data access. See DESIGN.md §5.1, §6."""

from __future__ import annotations

from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import Favorite, Track


def add_favorite(session: Session, track_id: int) -> bool:
    """Idempotent. Returns False only if the track does not exist."""
    if session.get(Track, track_id) is None:
        return False
    if session.get(Favorite, track_id) is None:
        session.add(Favorite(track_id=track_id))
        session.commit()
    return True


def remove_favorite(session: Session, track_id: int) -> None:
    favorite = session.get(Favorite, track_id)
    if favorite is not None:
        session.delete(favorite)
        session.commit()


def list_favorites(session: Session) -> Sequence[Track]:
    stmt = (
        select(Track)
        .join(Favorite, Favorite.track_id == Track.id)
        .order_by(Favorite.created_at.desc())
    )
    return session.exec(stmt).all()
