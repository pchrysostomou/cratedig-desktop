from app.repositories import tracks as trepo


def _track(session, n):
    return trepo.create_track(
        session,
        source_id=f"s{n}",
        title=f"Track {n}",
        artists=["X"],
        primary_artist="X",
        album="A",
        duration_ms=1000,
        file_path=f"C:/m/{n}.mp3",
        file_format="mp3",
    )


def test_playlist_crud(client):
    res = client.post("/playlists", json={"name": "Roadtrip", "description": "vroom"})
    assert res.status_code == 201
    pid = res.json()["id"]
    assert res.json()["track_count"] == 0

    assert [p["name"] for p in client.get("/playlists").json()] == ["Roadtrip"]

    res = client.patch(f"/playlists/{pid}", json={"name": "Road trip"})
    assert res.json()["name"] == "Road trip"

    assert client.delete(f"/playlists/{pid}").status_code == 204
    assert client.get(f"/playlists/{pid}").status_code == 404


def test_playlist_add_remove_reorder(client, session):
    t1, t2, t3 = _track(session, 1), _track(session, 2), _track(session, 3)
    pid = client.post("/playlists", json={"name": "P"}).json()["id"]

    for t in (t1, t2, t3):
        assert client.post(f"/playlists/{pid}/tracks", json={"track_id": t.id}).status_code == 201
    # duplicate add -> 409
    assert client.post(f"/playlists/{pid}/tracks", json={"track_id": t1.id}).status_code == 409

    detail = client.get(f"/playlists/{pid}").json()
    assert [t["id"] for t in detail["tracks"]] == [t1.id, t2.id, t3.id]
    assert detail["track_count"] == 3

    # reorder: reverse
    res = client.put(f"/playlists/{pid}/order", json={"ordered_track_ids": [t3.id, t2.id, t1.id]})
    assert [t["id"] for t in res.json()["tracks"]] == [t3.id, t2.id, t1.id]

    # remove the middle
    assert client.delete(f"/playlists/{pid}/tracks/{t2.id}").status_code == 204
    assert [t["id"] for t in client.get(f"/playlists/{pid}").json()["tracks"]] == [t3.id, t1.id]


def test_playlist_delete_cascades_join_rows(client, session):
    t1 = _track(session, 1)
    pid = client.post("/playlists", json={"name": "P"}).json()["id"]
    client.post(f"/playlists/{pid}/tracks", json={"track_id": t1.id})
    assert client.delete(f"/playlists/{pid}").status_code == 204
    # the track itself still exists; only the join row was cascaded
    assert client.get(f"/tracks/{t1.id}").status_code == 200


def test_add_track_unknown_playlist_404(client, session):
    t1 = _track(session, 1)
    assert client.post("/playlists/999/tracks", json={"track_id": t1.id}).status_code == 404
