"""Playlist endpoints. See DESIGN.md §5.1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.repositories import playlists as repo
from app.repositories import tracks as tracks_repo
from app.schemas import (
    PlaylistAddTrack,
    PlaylistCreate,
    PlaylistDetail,
    PlaylistRead,
    PlaylistUpdate,
    ReorderRequest,
)

router = APIRouter()


def _read(playlist, track_count: int) -> PlaylistRead:
    return PlaylistRead(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at,
        track_count=track_count,
    )


def _detail(session: Session, playlist) -> PlaylistDetail:
    tracks = tracks_repo.to_reads(session, repo.get_playlist_tracks(session, playlist.id))
    return PlaylistDetail(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at,
        track_count=len(tracks),
        tracks=tracks,
    )


@router.get("/playlists", response_model=list[PlaylistRead])
def list_playlists(session: Annotated[Session, Depends(get_session)]) -> list[PlaylistRead]:
    counts = repo.track_counts(session)
    return [_read(p, counts.get(p.id, 0)) for p in repo.list_playlists(session)]


@router.post("/playlists", response_model=PlaylistRead, status_code=201)
def create_playlist(
    body: PlaylistCreate, session: Annotated[Session, Depends(get_session)]
) -> PlaylistRead:
    playlist = repo.create_playlist(session, body.name, body.description)
    return _read(playlist, 0)


@router.get("/playlists/{playlist_id}", response_model=PlaylistDetail)
def get_playlist(
    playlist_id: int, session: Annotated[Session, Depends(get_session)]
) -> PlaylistDetail:
    playlist = repo.get_playlist(session, playlist_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return _detail(session, playlist)


@router.patch("/playlists/{playlist_id}", response_model=PlaylistRead)
def update_playlist(
    playlist_id: int,
    body: PlaylistUpdate,
    session: Annotated[Session, Depends(get_session)],
) -> PlaylistRead:
    playlist = repo.update_playlist(
        session, playlist_id, name=body.name, description=body.description
    )
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    counts = repo.track_counts(session)
    return _read(playlist, counts.get(playlist_id, 0))


@router.delete("/playlists/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: int, session: Annotated[Session, Depends(get_session)]) -> None:
    if not repo.delete_playlist(session, playlist_id):
        raise HTTPException(status_code=404, detail="Playlist not found")


@router.post("/playlists/{playlist_id}/tracks", status_code=201)
def add_track(
    playlist_id: int,
    body: PlaylistAddTrack,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    result = repo.add_track(session, playlist_id, body.track_id, body.position)
    if result == "missing":
        raise HTTPException(status_code=404, detail="Playlist or track not found")
    if result == "duplicate":
        raise HTTPException(status_code=409, detail="Track already in playlist")
    return {"status": "added"}


@router.delete("/playlists/{playlist_id}/tracks/{track_id}", status_code=204)
def remove_track(
    playlist_id: int, track_id: int, session: Annotated[Session, Depends(get_session)]
) -> None:
    if not repo.remove_track(session, playlist_id, track_id):
        raise HTTPException(status_code=404, detail="Track not in playlist")


@router.put("/playlists/{playlist_id}/order", response_model=PlaylistDetail)
def reorder(
    playlist_id: int,
    body: ReorderRequest,
    session: Annotated[Session, Depends(get_session)],
) -> PlaylistDetail:
    if not repo.reorder(session, playlist_id, body.ordered_track_ids):
        raise HTTPException(status_code=404, detail="Playlist not found")
    playlist = repo.get_playlist(session, playlist_id)
    return _detail(session, playlist)
