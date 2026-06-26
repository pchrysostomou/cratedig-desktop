"""Download endpoints. See DESIGN.md §5.1, §5.2.

POST /download enqueues a cratedig run (returns 202 + job_id); progress is polled
via GET /jobs/{id}. One job runs at a time (FIFO). DELETE dismisses a *finished*
job — cancelling an in-flight download is not supported yet.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.db import get_session
from app.jobs import JobManager, JobState
from app.models import DownloadJob
from app.repositories import jobs as jobs_repo
from app.schemas import DownloadRequest, JobRead

router = APIRouter()


def get_job_manager(request: Request) -> JobManager:
    return request.app.state.job_manager


def _state_to_read(state: JobState) -> JobRead:
    return JobRead(**asdict(state))


def _db_to_read(job: DownloadJob) -> JobRead:
    return JobRead(
        id=job.id,
        query=job.query,
        status=job.status,
        done=job.done,
        total=job.total,
        error=job.error,
        created_at=job.created_at,
        finished_at=job.finished_at,
    )


@router.post("/download", status_code=202)
def start_download(
    req: DownloadRequest,
    jm: Annotated[JobManager, Depends(get_job_manager)],
) -> dict[str, str]:
    return {"job_id": jm.submit(req)}


@router.get("/jobs", response_model=list[JobRead])
def list_jobs(
    jm: Annotated[JobManager, Depends(get_job_manager)],
    session: Annotated[Session, Depends(get_session)],
    active: bool = False,
) -> list[JobRead]:
    # Prefer live in-memory state (fresh done/total/track_ids); fall back to the DB record.
    out: list[JobRead] = []
    for job in jobs_repo.list_jobs(session, active=active):
        state = jm.get(job.id)
        out.append(_state_to_read(state) if state is not None else _db_to_read(job))
    return out


@router.get("/jobs/{job_id}", response_model=JobRead)
def get_job(
    job_id: str,
    jm: Annotated[JobManager, Depends(get_job_manager)],
    session: Annotated[Session, Depends(get_session)],
) -> JobRead:
    state = jm.get(job_id)
    if state is not None:
        return _state_to_read(state)
    job = jobs_repo.get_job(session, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return _db_to_read(job)


@router.delete("/jobs/{job_id}", status_code=204)
def dismiss_job(
    job_id: str,
    jm: Annotated[JobManager, Depends(get_job_manager)],
    session: Annotated[Session, Depends(get_session)],
) -> None:
    state = jm.get(job_id)
    if state is not None and state.status in ("queued", "running"):
        raise HTTPException(
            status_code=409,
            detail="Cannot dismiss an active job; mid-download cancellation is not supported yet.",
        )
    existed = jobs_repo.delete_job(session, job_id)
    jm.forget(job_id)
    if not existed and state is None:
        raise HTTPException(status_code=404, detail="Job not found")
