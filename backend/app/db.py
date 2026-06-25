"""SQLite via SQLModel. See DESIGN.md §6.

Phase 0 creates the database file + engine; the table models land in Phase 1, so
``init_db`` simply ensures the data directory and DB file exist and the connection
works. ``SQLModel.metadata.create_all`` is a no-op until models are registered.
"""

from __future__ import annotations

from sqlmodel import SQLModel, create_engine

from app.config import settings

# check_same_thread=False: the download job runs in a worker thread (DESIGN.md §5.2),
# so the connection must be usable across threads.
engine = create_engine(
    f"sqlite:///{settings.db_path}",
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    """Create the data dir, the DB file, and any registered tables (none yet in Phase 0)."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)
