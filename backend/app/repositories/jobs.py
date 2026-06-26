"""download_jobs table access. See DESIGN.md §5.2, §6.

Persists job lifecycle so GET /jobs survives a backend restart. Live progress
(done/total) is held in memory by the JobManager; the DB stores the durable record.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import DownloadJob
from app.util import now_ms


def create_job(session: Session, job_id: str, query: str) -> DownloadJob:
    job = DownloadJob(id=job_id, query=query, status="queued")
    session.add(job)
    session.commit()
    return job


def set_running(session: Session, job_id: str) -> None:
    job = session.get(DownloadJob, job_id)
    if job is not None:
        job.status = "running"
        session.add(job)
        session.commit()


def finish_job(
    session: Session,
    job_id: str,
    *,
    status: str,
    done: int,
    total: int,
    error: str | None = None,
) -> None:
    job = session.get(DownloadJob, job_id)
    if job is not None:
        job.status = status
        job.done = done
        job.total = total
        job.error = error
        job.finished_at = now_ms()
        session.add(job)
        session.commit()


def get_job(session: Session, job_id: str) -> DownloadJob | None:
    return session.get(DownloadJob, job_id)


def list_jobs(session: Session, *, active: bool = False) -> Sequence[DownloadJob]:
    stmt = select(DownloadJob).order_by(DownloadJob.created_at.desc())
    if active:
        stmt = stmt.where(DownloadJob.status.in_(["queued", "running"]))
    return session.exec(stmt).all()


def mark_interrupted(session: Session) -> None:
    """On startup, fail any jobs a previous (killed) run left queued/running."""
    stmt = select(DownloadJob).where(DownloadJob.status.in_(["queued", "running"]))
    for job in session.exec(stmt).all():
        job.status = "error"
        job.error = "Interrupted by restart"
        job.finished_at = now_ms()
        session.add(job)
    session.commit()


def delete_job(session: Session, job_id: str) -> bool:
    job = session.get(DownloadJob, job_id)
    if job is None:
        return False
    session.delete(job)
    session.commit()
    return True
