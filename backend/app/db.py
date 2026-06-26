"""SQLite via SQLModel. See DESIGN.md §6.

Owns the engine, schema creation, and the per-request session dependency. The
SQLite ``foreign_keys`` pragma is enabled per connection so the ``ON DELETE
CASCADE`` relationships in app/models.py are actually enforced.
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# check_same_thread=False: the download job runs in a worker thread (DESIGN.md §5.2),
# so the connection must be usable across threads.
engine = create_engine(
    f"sqlite:///{settings.db_path}",
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _record) -> None:
    # SQLite enforces ON DELETE CASCADE only when this pragma is set per connection.
    # busy_timeout lets a brief writer collision (download worker vs request) wait
    # rather than fail with "database is locked" (DESIGN §5.2 concurrency).
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


def init_db() -> None:
    """Create the data dir, the DB file, and all tables (DESIGN.md §6)."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    from app import models  # noqa: F401  — import registers tables on SQLModel.metadata

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """FastAPI dependency yielding a request-scoped database session."""
    with Session(engine) as session:
        yield session
