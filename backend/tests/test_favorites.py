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


def test_favorite_toggle_and_list(client, session):
    t1 = _track(session, 1)
    assert client.put(f"/favorites/{t1.id}").status_code == 204
    # idempotent add
    assert client.put(f"/favorites/{t1.id}").status_code == 204

    favs = client.get("/favorites").json()
    assert [t["id"] for t in favs] == [t1.id]
    # is_favorite reflected in the library + detail
    assert client.get("/library").json()[0]["is_favorite"] is True
    assert client.get(f"/tracks/{t1.id}").json()["is_favorite"] is True

    assert client.delete(f"/favorites/{t1.id}").status_code == 204
    assert client.get("/favorites").json() == []
    assert client.get(f"/tracks/{t1.id}").json()["is_favorite"] is False


def test_favorite_unknown_track_404(client):
    assert client.put("/favorites/999").status_code == 404
