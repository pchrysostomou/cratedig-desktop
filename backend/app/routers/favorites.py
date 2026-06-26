"""Favorites endpoints. See DESIGN.md §5.1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.repositories import favorites as repo
from app.repositories import tracks as tracks_repo
from app.schemas import TrackRead

router = APIRouter()


@router.get("/favorites", response_model=list[TrackRead])
def list_favorites(session: Annotated[Session, Depends(get_session)]) -> list[TrackRead]:
    return tracks_repo.to_reads(session, repo.list_favorites(session))


@router.put("/favorites/{track_id}", status_code=204)
def add_favorite(track_id: int, session: Annotated[Session, Depends(get_session)]) -> None:
    if not repo.add_favorite(session, track_id):
        raise HTTPException(status_code=404, detail="Track not found")


@router.delete("/favorites/{track_id}", status_code=204)
def remove_favorite(track_id: int, session: Annotated[Session, Depends(get_session)]) -> None:
    repo.remove_favorite(session, track_id)
