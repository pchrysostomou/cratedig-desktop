import time

from cratedig.models import DownloadResult, ResultStatus, Track


def _fake_download_factory(out_file):
    """A no-network stand-in for engine.run_download (cratedig's mocked-network rule)."""

    def fake(query, *, output_dir, audio_format=None, bitrate=None,
             cookies_from_browser=None, no_lyrics=False, on_progress=None):
        if on_progress is not None:
            on_progress(1, 1)
        track = Track(
            title="Get Lucky",
            artists=["Daft Punk", "Pharrell Williams"],
            album="Random Access Memories",
            isrc=None,
            duration_ms=369000,
            track_number=1,
            disc_number=1,
            release_year="2013",
            cover_art_url=None,
            source_id="mbid-x",
            lyrics=None,
        )
        return [
            DownloadResult(
                track=track,
                status=ResultStatus.SUCCESS,
                output_path=str(out_file),
                youtube_url="https://youtu.be/x",
            )
        ]

    return fake


def _poll(client, job_id, timeout=5.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        body = client.get(f"/jobs/{job_id}").json()
        if body["status"] in ("done", "error"):
            return body
        time.sleep(0.05)
    raise AssertionError(f"job {job_id} did not finish within {timeout}s")


def test_download_enqueues_runs_and_persists(client, tmp_path):
    out = tmp_path / "Daft Punk - Get Lucky.mp3"
    out.write_bytes(b"ID3-fake-audio")
    client.app.state.job_manager._download_fn = _fake_download_factory(out)

    res = client.post("/download", json={"query": "Daft Punk - Get Lucky"})
    assert res.status_code == 202
    job_id = res.json()["job_id"]

    body = _poll(client, job_id)
    assert body["status"] == "done"
    assert body["total"] == 1 and body["done"] == 1
    assert len(body["track_ids"]) == 1
    assert body["results_summary"]["success"] == 1

    # The track now appears in the library.
    lib = client.get("/library").json()
    assert [t["title"] for t in lib] == ["Get Lucky"]
    assert lib[0]["youtube_url"] == "https://youtu.be/x"


def test_download_idempotent_same_file(client, tmp_path):
    out = tmp_path / "x.mp3"
    out.write_bytes(b"audio")
    client.app.state.job_manager._download_fn = _fake_download_factory(out)

    j1 = client.post("/download", json={"query": "q"}).json()["job_id"]
    _poll(client, j1)
    j2 = client.post("/download", json={"query": "q"}).json()["job_id"]
    _poll(client, j2)

    assert len(client.get("/library").json()) == 1  # upsert by file_path


def test_download_fatal_error_marks_job_error(client):
    def boom(*args, **kwargs):
        from cratedig.exceptions import ProviderApiError

        raise ProviderApiError("bad query")

    client.app.state.job_manager._download_fn = boom
    job_id = client.post("/download", json={"query": "??"}).json()["job_id"]
    body = _poll(client, job_id)
    assert body["status"] == "error"
    assert "bad query" in (body["error"] or "")


def test_job_not_found(client):
    assert client.get("/jobs/does-not-exist").status_code == 404


def test_jobs_list_reflects_completed(client, tmp_path):
    out = tmp_path / "x.mp3"
    out.write_bytes(b"audio")
    client.app.state.job_manager._download_fn = _fake_download_factory(out)
    job_id = client.post("/download", json={"query": "q"}).json()["job_id"]
    _poll(client, job_id)

    jobs = client.get("/jobs").json()
    assert any(j["id"] == job_id and j["status"] == "done" for j in jobs)
