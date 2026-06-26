"""Read audio duration from a file (mutagen-first). See DESIGN.md §9 Phase 4.

cratedig's metadata source (MusicBrainz) sometimes returns no length, so the
persisted duration_ms can be 0. After download the file is on local disk, so we
backfill the real duration by reading its header. mutagen is already present via
cratedig — no new dependency.
"""

from __future__ import annotations

import mutagen


def read_duration_ms(path: str) -> int | None:
    """Return audio duration in milliseconds, or None if it can't be read.

    Handles BOTH mutagen failure modes: File() returns None for non-audio content,
    and RAISES mutagen.MutagenError (not an OSError) for missing/corrupt files.
    """
    try:
        audio = mutagen.File(path)
    except (mutagen.MutagenError, OSError):
        return None
    if audio is None or audio.info is None:
        return None
    length = getattr(audio.info, "length", 0) or 0
    if length <= 0:
        return None
    return int(round(length * 1000))
