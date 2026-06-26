from pathlib import Path

from app.repositories import tracks as repo

FIXTURE = Path(__file__).parent / "fixtures" / "silence.mp3"


def _seed(session, file_path, *, source_id="s", fmt="mp3"):
    return repo.create_track(
        session,
        source_id=source_id,
        title="Silence",
        artists=["X"],
        primary_artist="X",
        album="A",
        duration_ms=1000,
        file_path=str(file_path),
        file_format=fmt,
    )


def test_stream_range_returns_206(client, session):
    track = _seed(session, FIXTURE)
    res = client.get(f"/stream/{track.id}", headers={"Range": "bytes=0-99"})
    assert res.status_code == 206
    assert res.headers["accept-ranges"] == "bytes"
    assert res.headers["content-range"].startswith("bytes 0-99/")
    assert res.headers["content-type"] == "audio/mpeg"


def test_stream_full_returns_200(client, session):
    track = _seed(session, FIXTURE)
    res = client.get(f"/stream/{track.id}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "audio/mpeg"
    assert res.headers["accept-ranges"] == "bytes"


def test_stream_missing_file_404(client, session):
    track = _seed(session, "C:/nope/missing.mp3")
    assert client.get(f"/stream/{track.id}").status_code == 404


def test_stream_unknown_track_404(client):
    assert client.get("/stream/999999").status_code == 404
