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


def test_queue_replace_and_get(client, session):
    t1, t2 = _track(session, 1), _track(session, 2)
    res = client.put("/queue", json={"track_ids": [t2.id, t1.id], "current_index": 1})
    assert res.status_code == 200
    body = res.json()
    assert [t["id"] for t in body["items"]] == [t2.id, t1.id]
    assert body["current_index"] == 1

    got = client.get("/queue").json()
    assert [t["id"] for t in got["items"]] == [t2.id, t1.id]
    assert got["current_index"] == 1


def test_player_state_defaults_and_update(client):
    state = client.get("/player-state").json()
    assert state["repeat_mode"] == "off"
    assert state["shuffle"] is False
    assert state["volume"] == 100

    res = client.put(
        "/player-state",
        json={"shuffle": True, "repeat_mode": "all", "volume": 60, "position_ms": 42000},
    )
    assert res.status_code == 200
    state = res.json()
    assert state["shuffle"] is True
    assert state["repeat_mode"] == "all"
    assert state["volume"] == 60
    assert state["position_ms"] == 42000

    # persists across a fresh read
    assert client.get("/player-state").json()["position_ms"] == 42000
