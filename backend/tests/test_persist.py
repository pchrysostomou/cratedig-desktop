from pathlib import Path

from cratedig.models import DownloadResult, ResultStatus, Track

from app.audio_meta import read_duration_ms
from app.repositories import tracks as repo

FIXTURE = Path(__file__).parent / "fixtures" / "silence.mp3"


def _result(out_file, *, status=ResultStatus.SUCCESS, source_id="mbid-x", duration_ms=369000):
    track = Track(
        title="Get Lucky",
        artists=["Daft Punk", "Pharrell Williams"],
        album="Random Access Memories",
        isrc=None,
        duration_ms=duration_ms,
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
    assert len(repo.list_tracks(session)) == 1


def test_persist_skips_unsuccessful(session, tmp_path):
    out = tmp_path / "a.mp3"
    out.write_bytes(b"x")
    assert repo.save_download_result(session, _result(out, status=ResultStatus.FAILED)) is None
    assert repo.save_download_result(session, _result(out, status=ResultStatus.NOT_FOUND)) is None
    assert len(repo.list_tracks(session)) == 0


def test_duration_backfilled_when_zero(session):
    # Metadata gave 0; the real duration is read from the file header (~1s fixture).
    track = repo.save_download_result(session, _result(FIXTURE, duration_ms=0))
    assert track is not None
    assert 800 <= track.duration_ms <= 1300


def test_duration_not_overwritten_when_known(session, tmp_path):
    out = tmp_path / "a.mp3"
    out.write_bytes(b"not really audio")
    track = repo.save_download_result(session, _result(out, duration_ms=369000))
    assert track.duration_ms == 369000  # keep the metadata value; no file read


def test_read_duration_ms_handles_bad_input(tmp_path):
    nonaudio = tmp_path / "x.mp3"
    nonaudio.write_bytes(b"not audio")
    assert read_duration_ms(str(nonaudio)) is None
    assert read_duration_ms(str(tmp_path / "missing.mp3")) is None
