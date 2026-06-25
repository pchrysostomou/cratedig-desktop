"""FastAPI application entry. See DESIGN.md §1, §5.

The "kitchen": the only component that touches the cratedig engine and SQLite.
Phase 0 wires the app, CORS, the DB init, and the health router only.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.db import init_db
from app.routers import health


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="cratedig-desktop backend", version=__version__, lifespan=lifespan)

# The WebView origin differs by platform; the Vite dev server is :1420. The server
# binds loopback only, so this list is a tightening, not the security boundary (§5.3).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://tauri.localhost",
        "tauri://localhost",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
