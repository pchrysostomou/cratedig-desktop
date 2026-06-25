def test_library_empty(client):
    res = client.get("/library")
    assert res.status_code == 200
    assert res.json() == []


def test_library_lists_seeded(client, sample_tracks):
    res = client.get("/library")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    # Default sort is added_at desc → newest first (Instant Crush, added_at=2000).
    assert body[0]["title"] == "Instant Crush"
    assert body[0]["is_favorite"] is False
    assert body[0]["artists"] == ["Daft Punk", "Julian Casablancas"]
    # Local filesystem fields must NOT be exposed.
    assert "file_path" not in body[0]


def test_library_search_q(client, sample_tracks):
    # Matches title...
    res = client.get("/library", params={"q": "lucky"})
    assert [t["title"] for t in res.json()] == ["Get Lucky"]
    # ...and artist (case-insensitive).
    res2 = client.get("/library", params={"q": "CASABLANCAS"})
    assert [t["title"] for t in res2.json()] == ["Instant Crush"]
    # ...and album (both tracks share it).
    res3 = client.get("/library", params={"q": "random access"})
    assert len(res3.json()) == 2


def test_library_sort_and_order(client, sample_tracks):
    res = client.get("/library", params={"sort": "title", "order": "asc"})
    assert [t["title"] for t in res.json()] == ["Get Lucky", "Instant Crush"]


def test_library_pagination(client, sample_tracks):
    res = client.get(
        "/library", params={"sort": "title", "order": "asc", "limit": 1, "offset": 1}
    )
    assert [t["title"] for t in res.json()] == ["Instant Crush"]


def test_library_rejects_unwhitelisted_sort(client):
    # sort outside the SortField whitelist is rejected by validation (injection guard).
    res = client.get("/library", params={"sort": "file_path"})
    assert res.status_code == 422
