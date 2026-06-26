from app.repositories import tracks as repo


def _seed(session):
    return repo.create_track(
        session,
        source_id="s",
        title="T",
        artists=["X"],
        primary_artist="X",
        album="A",
        duration_ms=1000,
        file_path="C:/m/t.mp3",
        file_format="mp3",
    )


def test_history_increments_play_count(client, session):
    track = _seed(session)
    assert client.post("/history", json={"track_id": track.id}).status_code == 201
    assert client.get(f"/tracks/{track.id}").json()["play_count"] == 1
    client.post("/history", json={"track_id": track.id})
    assert client.get(f"/tracks/{track.id}").json()["play_count"] == 2
    assert len(client.get("/history").json()) == 2


def test_history_unknown_track_404(client):
    assert client.post("/history", json={"track_id": 999999}).status_code == 404
