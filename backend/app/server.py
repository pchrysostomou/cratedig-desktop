"""Frozen sidecar entrypoint (PyInstaller). See DESIGN.md §3.3, §8.

Sets UTF-8 for the frozen Windows process, ensures FFmpeg is reachable
(system-first, bundled fallback — §3.3), then runs the FastAPI app under uvicorn
on 127.0.0.1:8008. In dev you can still run `uvicorn app.main:app` directly; this
module is what the Tauri sidecar executable runs.
"""

from __future__ import annotations

import os
import shutil
import sys

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")


def _ensure_ffmpeg_on_path() -> None:
    # Prefer a system FFmpeg; only fall back to a bundled copy next to the frozen
    # exe (DESIGN §3.3). cratedig resolves it via shutil.which on PATH.
    if shutil.which("ffmpeg") is not None:
        return
    base = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    bundled = os.path.join(base, "ffmpeg")
    if os.path.isdir(bundled):
        os.environ["PATH"] = bundled + os.pathsep + os.environ.get("PATH", "")


def main() -> None:
    _ensure_ffmpeg_on_path()
    import uvicorn

    from app.main import app

    uvicorn.run(app, host="127.0.0.1", port=8008, log_level="info")


if __name__ == "__main__":
    main()
