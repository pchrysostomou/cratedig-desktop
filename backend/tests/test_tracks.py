def test_track_detail_found(client, sample_tracks):
    track_id = sample_tracks[0].id
    res = client.get(f"/tracks/{track_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Get Lucky"
    assert body["is_favorite"] is False
    assert body["playlist_ids"] == []
    assert "lyrics" in body  # detail includes lyrics (None here)
    assert "file_path" not in body


def test_track_detail_404(client):
    res = client.get("/tracks/999999")
    assert res.status_code == 404
    assert res.json()["detail"] == "Track not found"


def _seed_with_file(session, file_path, source_id="d1"):
    from app.repositories import tracks as repo

    return repo.create_track(
        session,
        source_id=source_id,
        title="Doomed",
        artists=["X"],
        primary_artist="X",
        album="A",
        duration_ms=1000,
        file_path=str(file_path),
        file_format="mp3",
    )


def test_delete_track_removes_from_library(client, sample_tracks):
    track_id = sample_tracks[0].id
    assert client.delete(f"/tracks/{track_id}").status_code == 204
    assert client.get(f"/tracks/{track_id}").status_code == 404
    assert track_id not in [t["id"] for t in client.get("/library").json()]


def test_delete_track_404(client):
    assert client.delete("/tracks/999999").status_code == 404


def test_delete_track_keeps_file_by_default(client, session, tmp_path):
    f = tmp_path / "keep.mp3"
    f.write_bytes(b"audio")
    track = _seed_with_file(session, f)
    assert client.delete(f"/tracks/{track.id}").status_code == 204
    assert f.exists()  # delete_file defaults False → file kept


def test_delete_track_with_delete_file_removes_file(client, session, tmp_path):
    f = tmp_path / "gone.mp3"
    f.write_bytes(b"audio")
    track = _seed_with_file(session, f, source_id="d2")
    assert client.delete(f"/tracks/{track.id}?delete_file=true").status_code == 204
    assert not f.exists()  # file removed


def test_delete_track_cascades_favorite(client, session):
    track = _seed_with_file(session, "C:/m/c.mp3", source_id="d3")
    client.put(f"/favorites/{track.id}")
    assert client.delete(f"/tracks/{track.id}").status_code == 204
    assert client.get("/favorites").json() == []  # favorite cascaded away
