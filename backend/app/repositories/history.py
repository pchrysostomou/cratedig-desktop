"""play_history + play_count. See DESIGN.md §5.1, §6."""

from __future__ import annotations

from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import PlayHistory, Track
from app.util import now_ms


def add_play(session: Session, track_id: int, ms_played: int | None = None) -> PlayHistory | None:
    """Record a play: insert a history row and bump the track's play_count/last_played_at."""
    track = session.get(Track, track_id)
    if track is None:
        return None
    now = now_ms()
    track.play_count += 1
    track.last_played_at = now
    entry = PlayHistory(track_id=track_id, played_at=now, ms_played=ms_played)
    session.add(track)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def list_history(session: Session, *, limit: int = 100) -> Sequence[PlayHistory]:
    stmt = select(PlayHistory).order_by(PlayHistory.played_at.desc()).limit(limit)
    return session.exec(stmt).all()
