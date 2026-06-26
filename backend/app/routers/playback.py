"""Queue + player-state endpoints. See DESIGN.md §5.1.

The queue is the ordered track list; player-state holds current_index, shuffle,
repeat, volume, and position_ms so playback resumes after a restart (DESIGN §9 Ph5).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.repositories import playback as repo
from app.repositories import tracks as tracks_repo
from app.schemas import PlayerStateRead, PlayerStateUpdate, QueueRead, QueueReplace

router = APIRouter()


def _player_read(state) -> PlayerStateRead:
    return PlayerStateRead(
        current_index=state.current_index,
        is_playing=bool(state.is_playing),
        repeat_mode=state.repeat_mode,
        shuffle=bool(state.shuffle),
        volume=state.volume,
        position_ms=state.position_ms,
    )


@router.get("/queue", response_model=QueueRead)
def get_queue(session: Annotated[Session, Depends(get_session)]) -> QueueRead:
    items = tracks_repo.to_reads(session, repo.get_queue_tracks(session))
    state = repo.get_player_state(session)
    return QueueRead(items=items, current_index=state.current_index)


@router.put("/queue", response_model=QueueRead)
def put_queue(
    body: QueueReplace, session: Annotated[Session, Depends(get_session)]
) -> QueueRead:
    repo.replace_queue(session, body.track_ids)
    if body.current_index is not None:
        repo.update_player_state(session, current_index=body.current_index)
    items = tracks_repo.to_reads(session, repo.get_queue_tracks(session))
    state = repo.get_player_state(session)
    return QueueRead(items=items, current_index=state.current_index)


@router.get("/player-state", response_model=PlayerStateRead)
def get_player_state(session: Annotated[Session, Depends(get_session)]) -> PlayerStateRead:
    return _player_read(repo.get_player_state(session))


@router.put("/player-state", response_model=PlayerStateRead)
def put_player_state(
    body: PlayerStateUpdate, session: Annotated[Session, Depends(get_session)]
) -> PlayerStateRead:
    # bool -> int for the SQLite columns; None fields are skipped by the repo.
    fields: dict[str, object] = {
        "current_index": body.current_index,
        "repeat_mode": body.repeat_mode,
        "volume": body.volume,
        "position_ms": body.position_ms,
        "shuffle": None if body.shuffle is None else int(body.shuffle),
        "is_playing": None if body.is_playing is None else int(body.is_playing),
    }
    return _player_read(repo.update_player_state(session, **fields))
