# PyInstaller spec — cratedig-desktop backend sidecar (ONEDIR, strategy B). See DESIGN.md §8.2.
#
# Build (from backend/, with the dev extras + pyinstaller installed in the venv):
#     python -m PyInstaller cratedig-sidecar.spec --noconfirm --clean
# Output: dist/cratedig-sidecar/  — a folder with cratedig-sidecar.exe + _internal/.
# The build-sidecar script copies that folder into src-tauri/binaries/cratedig-sidecar/,
# which Tauri ships via bundle.resources and launches by absolute path.
#
# onedir (not onefile) is deliberate: a onefile exe is a single ~35 MB blob that
# Windows Defender locks at build time and re-extracts to %TEMP% on every launch —
# it fails for ANY user, not just on this machine. onedir's small per-file layout
# avoids both the build-lock and the runtime extraction (matches cratedig's CLI).

import os

from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = []

# Compiled extensions / lazily-loaded data PyInstaller's static analysis misses.
for _pkg in ("pydantic", "pydantic_core", "yt_dlp", "certifi"):
    _d, _b, _h = collect_all(_pkg)
    datas += _d
    binaries += _b
    hiddenimports += _h

# Dynamically-imported submodules (uvicorn loops/protocols/lifespan; the app's own
# lazily-imported engine; cratedig; etc.).
for _pkg in ("uvicorn", "anyio", "starlette", "fastapi", "cratedig", "app"):
    hiddenimports += collect_submodules(_pkg)

# Optional bundled FFmpeg fallback (system-first at runtime; see app/server.py).
# Only included if vendored; otherwise the system FFmpeg is used (§3.3).
for _name in ("ffmpeg.exe", "ffprobe.exe"):
    _p = os.path.join("vendor", _name)
    if os.path.exists(_p):
        binaries.append((_p, "ffmpeg"))

a = Analysis(
    ["app/server.py"],
    pathex=["."],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    excludes=["tkinter", "pytest", "_pytest"],
    noarchive=False,
)
pyz = PYZ(a.pure)

# onedir: the exe is a small bootstrapper; deps live alongside in _internal/.
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="cratedig-sidecar",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # UPX draws more AV false-positives; keep off
    console=True,  # so Tauri can capture stdout/stderr
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="cratedig-sidecar",
)
