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
