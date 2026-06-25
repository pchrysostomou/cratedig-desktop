"""Health / readiness endpoint. See DESIGN.md §5.1, §8.3.

The Tauri shell and the React UI poll GET /health before showing the app, so this
must stay dependency-free and instant.
"""

from __future__ import annotations

from fastapi import APIRouter

from app import __version__

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}
