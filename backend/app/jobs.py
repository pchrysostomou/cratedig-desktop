"""Download job manager — a FIFO queue with a single worker. See DESIGN.md §5.2, §10 Q8.

One download runs at a time. POST /download enqueues and returns immediately; the
worker runs the (blocking) cratedig engine off the event loop via asyncio.to_thread,
forwards on_progress(done, total) into live job state, and persists results to the
tracks table on completion. The download callable is injectable so tests use a fake
(no network), mirroring cratedig's "all network mocked" rule.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field

from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.repositories import jobs as jobs_repo
from app.repositories import tracks as tracks_repo
from app.schemas import DownloadRequest
from app.util import now_ms

DownloadFn = Callable[..., list]


@dataclass
class JobState:
    """In-memory live state for a download job (mirrored durably in download_jobs)."""

    id: str
    query: str
    status: str = "queued"  # queued | running | done | error
    done: int = 0
    total: int = 0
    error: str | None = None
    track_ids: list[int] = field(default_factory=list)
    results_summary: dict[str, int] | None = None
    created_at: int = field(default_factory=now_ms)
    finished_at: int | None = None


class JobManager:
    def __init__(self, download_fn: DownloadFn | None = None, output_dir: object = None) -> None:
        self._download_fn = download_fn  # None → lazy-import the real engine on first use
        self._output_dir = output_dir or settings.output_dir
        self._jobs: dict[str, JobState] = {}
        self._requests: dict[str, DownloadRequest] = {}
        self._queue: asyncio.Queue[str] | None = None
        self._worker: asyncio.Task | None = None

    async def start(self) -> None:
        self._queue = asyncio.Queue()
        with Session(engine) as session:
            jobs_repo.mark_interrupted(session)
        self._worker = asyncio.create_task(self._run_worker())

    async def stop(self) -> None:
        if self._worker is not None:
            self._worker.cancel()
            try:
                await self._worker
            except asyncio.CancelledError:
                pass

    def submit(self, req: DownloadRequest) -> str:
        assert self._queue is not None, "JobManager not started"
        job_id = uuid.uuid4().hex
        self._jobs[job_id] = JobState(id=job_id, query=req.query)
        self._requests[job_id] = req
        with Session(engine) as session:
            jobs_repo.create_job(session, job_id, req.query)
        self._queue.put_nowait(job_id)
        return job_id

    def get(self, job_id: str) -> JobState | None:
        return self._jobs.get(job_id)

    def forget(self, job_id: str) -> None:
        self._jobs.pop(job_id, None)
        self._requests.pop(job_id, None)

    async def _run_worker(self) -> None:
        assert self._queue is not None
        while True:
            job_id = await self._queue.get()
            try:
                await asyncio.to_thread(self._execute, job_id)
            except Exception as exc:  # any engine failure → mark the job errored
                self._fail(job_id, str(exc))
            finally:
                self._queue.task_done()

    def _execute(self, job_id: str) -> None:
        from cratedig.models import ResultStatus

        state = self._jobs[job_id]
        req = self._requests[job_id]
        state.status = "running"
        with Session(engine) as session:
            jobs_repo.set_running(session, job_id)

        def on_progress(done: int, total: int) -> None:
            state.done = done
            state.total = total

        download = self._download_fn
        if download is None:
            from app.engine import run_download

            download = run_download

        results = download(
            req.query,
            output_dir=self._output_dir,
            audio_format=req.format,
            bitrate=req.bitrate,
            cookies_from_browser=req.cookies_from_browser,
            no_lyrics=req.no_lyrics,
            on_progress=on_progress,
        )

        track_ids: list[int] = []
        summary = {status.value: 0 for status in ResultStatus}
        with Session(engine) as session:
            for result in results:
                summary[result.status.value] = summary.get(result.status.value, 0) + 1
                track = tracks_repo.save_download_result(session, result)
                if track is not None:
                    track_ids.append(track.id)

        state.track_ids = track_ids
        state.results_summary = summary
        state.status = "done"
        state.finished_at = now_ms()
        with Session(engine) as session:
            jobs_repo.finish_job(session, job_id, status="done", done=state.done, total=state.total)

    def _fail(self, job_id: str, message: str) -> None:
        state = self._jobs.get(job_id)
        done = state.done if state is not None else 0
        total = state.total if state is not None else 0
        if state is not None:
            state.status = "error"
            state.error = message
            state.finished_at = now_ms()
        with Session(engine) as session:
            jobs_repo.finish_job(
                session, job_id, status="error", done=done, total=total, error=message
            )
