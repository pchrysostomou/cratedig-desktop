"""Audio streaming + cover art. See DESIGN.md §5.1, §7.3.

/stream/{id} serves the local file via Starlette's FileResponse, which handles HTTP
Range -> 206 automatically (seeking) — do NOT hand-roll Range parsing. An explicit
media_type is passed because Windows mimetypes is unreliable for flac/opus/m4a.
/cover/{id} redirects to the remote cover_art_url for now (embedded-art extraction
is deferred, DESIGN §10).
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlmodel import Session

from app.db import get_session
from app.repositories import tracks as repo

router = APIRouter()

_MEDIA_TYPES = {
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "aac": "audio/mp4",
    "ogg": "audio/ogg",
    "oga": "audio/ogg",
    "opus": "audio/ogg",
    "flac": "audio/flac",
    "wav": "audio/wav",
}


@router.get("/stream/{track_id}")
def stream(track_id: int, session: Annotated[Session, Depends(get_session)]) -> FileResponse:
    track = repo.get_track(session, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    path = Path(track.file_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Audio file missing")
    ext = (track.file_format or path.suffix.lstrip(".")).lower()
    media_type = _MEDIA_TYPES.get(ext, "application/octet-stream")
    # content_disposition_type="inline": the WebView should stream it, not download it.
    return FileResponse(path, media_type=media_type, content_disposition_type="inline")


@router.get("/cover/{track_id}")
def cover(track_id: int, session: Annotated[Session, Depends(get_session)]) -> Response:
    track = repo.get_track(session, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    if track.cover_path:
        local = Path(track.cover_path)
        if local.is_file():
            return FileResponse(local)
    if track.cover_art_url:
        return RedirectResponse(track.cover_art_url)
    raise HTTPException(status_code=404, detail="No cover art")
