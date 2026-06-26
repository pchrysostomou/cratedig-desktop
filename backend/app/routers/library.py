"""Library read endpoints. See DESIGN.md §5.1.

GET /library         — the grid (search within library + sort + pagination).
GET /tracks/{id}     — track detail (404 when missing).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.db import get_session
from app.repositories import tracks as repo
from app.schemas import SortField, SortOrder, TrackDetail, TrackRead

router = APIRouter()


@router.get("/library", response_model=list[TrackRead])
def get_library(
    session: Annotated[Session, Depends(get_session)],
    q: Annotated[str | None, Query(description="Search title / artist / album")] = None,
    sort: SortField = SortField.added_at,
    order: SortOrder = SortOrder.desc,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TrackRead]:
    rows = repo.list_tracks(session, q=q, sort=sort, order=order, limit=limit, offset=offset)
    return repo.to_reads(session, rows)


@router.get("/tracks/{track_id}", response_model=TrackDetail)
def get_track(
    track_id: int,
    session: Annotated[Session, Depends(get_session)],
) -> TrackDetail:
    track = repo.get_track(session, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    favorites = repo.favorite_ids(session, [track.id])
    return TrackDetail(
        **track.model_dump(),
        is_favorite=track.id in favorites,
        playlist_ids=repo.playlist_ids_for(session, track.id),
    )
