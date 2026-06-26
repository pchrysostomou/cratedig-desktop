"""History endpoints. See DESIGN.md §5.1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.repositories import history as repo
from app.schemas import HistoryCreate, HistoryRead

router = APIRouter()


@router.post("/history", response_model=HistoryRead, status_code=201)
def record_play(
    body: HistoryCreate,
    session: Annotated[Session, Depends(get_session)],
) -> HistoryRead:
    entry = repo.add_play(session, body.track_id, body.ms_played)
    if entry is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return HistoryRead(
        id=entry.id, track_id=entry.track_id, played_at=entry.played_at, ms_played=entry.ms_played
    )


@router.get("/history", response_model=list[HistoryRead])
def get_history(
    session: Annotated[Session, Depends(get_session)],
    limit: int = 100,
) -> list[HistoryRead]:
    return [
        HistoryRead(id=e.id, track_id=e.track_id, played_at=e.played_at, ms_played=e.ms_played)
        for e in repo.list_history(session, limit=limit)
    ]
