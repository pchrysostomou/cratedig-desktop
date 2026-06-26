"""Adapter over the cratedig engine (UNCHANGED). See DESIGN.md §3.2.

Mirrors cratedig's cli.py wiring: build the Orchestrator with its injected
collaborators and call run(query, on_progress=...). Returns cratedig's
list[DownloadResult]; the caller persists them (app/repositories/tracks.py).
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from cratedig.config import get_settings
from cratedig.core.orchestrator import Orchestrator
from cratedig.download.matcher import rank_candidates
from cratedig.download.youtube_downloader import YouTubeDownloader
from cratedig.lyrics.lyrics_fetcher import fetch_lyrics
from cratedig.models import DownloadResult
from cratedig.providers.musicbrainz_handler import MusicBrainzHandler
from cratedig.tagging.tagger import Tagger
from yt_dlp import YoutubeDL

ProgressCallback = Callable[[int, int], None]


def run_download(
    query: str,
    *,
    output_dir: Path | str,
    audio_format: str | None = None,
    bitrate: str | None = None,
    cookies_from_browser: str | None = None,
    no_lyrics: bool = False,
    on_progress: ProgressCallback | None = None,
) -> list[DownloadResult]:
    """Run a cratedig download for ``query`` and return its DownloadResults.

    ``None`` knobs fall back to cratedig's defaults (get_settings drops them).
    Raises cratedig's ProviderError on a fatal fetch failure (bad URL / API down);
    per-track failures are returned as FAILED/NOT_FOUND results, never raised.
    """
    settings = get_settings(
        output_dir=output_dir,
        audio_format=audio_format,
        bitrate=bitrate,
        cookies_from_browser=cookies_from_browser,
    )
    orchestrator = Orchestrator(
        handler=MusicBrainzHandler(),
        downloader=YouTubeDownloader(
            settings.output_dir,
            audio_format=settings.audio_format,
            bitrate=settings.bitrate,
            cookies_from_browser=settings.cookies_from_browser,
        ),
        ranker=rank_candidates,
        lyrics_fetcher=None if no_lyrics else fetch_lyrics,
        tagger=Tagger(),
        ydl=YoutubeDL({"quiet": True, "no_warnings": True, "ignoreerrors": True}),
        max_workers=settings.max_workers,
    )
    return orchestrator.run(query, on_progress=on_progress)
