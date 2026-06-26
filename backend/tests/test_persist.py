from cratedig.models import DownloadResult, ResultStatus, Track

from app.repositories import tracks as repo


def _result(out_file, *, status=ResultStatus.SUCCESS, source_id="mbid-x"):
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
        source_id=source_id,
        lyrics=None,
    )
    return DownloadResult(
        track=track,
        status=status,
        output_path=str(out_file),
        youtube_url="https://youtu.be/x",
    )


def test_persist_success(session, tmp_path):
    out = tmp_path / "Daft Punk - Get Lucky.mp3"
    out.write_bytes(b"audio-bytes")
    track = repo.save_download_result(session, _result(out))
    assert track is not None
    assert track.title == "Get Lucky"
    assert track.artists == ["Daft Punk", "Pharrell Williams"]
    assert track.primary_artist == "Daft Punk"
    assert track.file_format == "mp3"
    assert track.file_size == len(b"audio-bytes")
    assert track.youtube_url == "https://youtu.be/x"


def test_persist_idempotent_by_file_path(session, tmp_path):
    out = tmp_path / "a.mp3"
    out.write_bytes(b"x")
    t1 = repo.save_download_result(session, _result(out))
    t2 = repo.save_download_result(session, _result(out))
    assert t1.id == t2.id
    assert len(repo.list_tracks(session)) == 1  # upsert by file_path, no duplicate


def test_persist_skips_unsuccessful(session, tmp_path):
    out = tmp_path / "a.mp3"
    out.write_bytes(b"x")
    assert repo.save_download_result(session, _result(out, status=ResultStatus.FAILED)) is None
    assert repo.save_download_result(session, _result(out, status=ResultStatus.NOT_FOUND)) is None
    assert len(repo.list_tracks(session)) == 0
