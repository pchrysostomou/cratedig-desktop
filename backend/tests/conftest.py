import os
import tempfile

# Point the app at a throwaway data dir BEFORE importing it, so tests never touch
# the real %APPDATA% library.db. Must run before `from app...` imports below.
os.environ.setdefault(
    "CRATEDIG_DESKTOP_DATA_DIR",
    tempfile.mkdtemp(prefix="cratedig-desktop-test-"),
)

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app import models  # noqa: F401  — register tables on SQLModel.metadata
from app.db import engine
from app.main import app
from app.repositories import tracks as repo


@pytest.fixture(autouse=True)
def reset_db():
    """Fresh, empty schema for every test."""
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


@pytest.fixture
def session():
    with Session(engine) as s:
        yield s


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_tracks(session):
    """Two tracks with explicit added_at so ordering is deterministic."""
    a = repo.create_track(
        session,
        source_id="mbid-1",
        title="Get Lucky",
        artists=["Daft Punk", "Pharrell Williams"],
        primary_artist="Daft Punk",
        album="Random Access Memories",
        duration_ms=369000,
        release_year="2013",
        file_path="C:/Music/Daft Punk - Get Lucky.mp3",
        file_format="mp3",
        youtube_url="https://youtu.be/abc",
        added_at=1000,
    )
    b = repo.create_track(
        session,
        source_id="mbid-2",
        title="Instant Crush",
        artists=["Daft Punk", "Julian Casablancas"],
        primary_artist="Daft Punk",
        album="Random Access Memories",
        duration_ms=337000,
        release_year="2013",
        file_path="C:/Music/Daft Punk - Instant Crush.mp3",
        file_format="mp3",
        added_at=2000,
    )
    return [a, b]
