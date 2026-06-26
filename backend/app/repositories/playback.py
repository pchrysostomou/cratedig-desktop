"""Persisted queue + player state. See DESIGN.md §5.1, §6.

The `queue` table holds the ordered track ids; the `player_state` singleton (id=1)
holds current_index / shuffle / repeat / volume / position_ms / is_playing.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import PlayerState, QueueItem, Track


def get_queue_tracks(session: Session) -> Sequence[Track]:
    stmt = (
        select(Track)
        .join(QueueItem, QueueItem.track_id == Track.id)
        .order_by(QueueItem.position.asc())
    )
    return session.exec(stmt).all()


def replace_queue(session: Session, track_ids: list[int]) -> None:
    for item in session.exec(select(QueueItem)).all():
        session.delete(item)
    for position, track_id in enumerate(track_ids):
        session.add(QueueItem(position=position, track_id=track_id))
    session.commit()


def get_player_state(session: Session) -> PlayerState:
    state = session.get(PlayerState, 1)
    if state is None:
        state = PlayerState(id=1)
        session.add(state)
        session.commit()
        session.refresh(state)
    return state


def update_player_state(session: Session, **fields: object) -> PlayerState:
    state = get_player_state(session)
    for key, value in fields.items():
        if value is not None and hasattr(state, key):
            setattr(state, key, value)
    session.add(state)
    session.commit()
    session.refresh(state)
    return state
