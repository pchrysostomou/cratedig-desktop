# cratedig-desktop

> A cross-platform (Windows-first) desktop music app. Paste a **MusicBrainz** link or search
> `Artist - Title`, and it downloads the track via the
> **[cratedig](https://github.com/pchrysostomou/cratedig)** engine, then manages and plays it like
> Spotify — library, playlists, favorites, queue, and an in-app player. A native desktop app
> (Tauri), not a web app.

**Architecture** (see [`DESIGN.md`](DESIGN.md) — the single source of truth): a React + TypeScript
UI → a local FastAPI backend → the `cratedig` engine + SQLite. The UI never downloads; it calls the
backend; the backend owns `cratedig` + the database + the audio files.

## Status

**Phase 0 — scaffold.** The backend serves `/health`; the React shell renders and shows a
backend-connected indicator. Features arrive phase by phase ([`DESIGN.md`](DESIGN.md) §9).

## Development

Requires **Python 3.10+** and **Node 18+**.

### Backend (FastAPI)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1            # PowerShell  (cmd: .venv\Scripts\activate.bat)
pip install -e ".[dev]"               # FastAPI + SQLModel + the cratedig engine (from GitHub)
uvicorn app.main:app --port 8008 --reload
# → GET http://127.0.0.1:8008/health  →  {"status":"ok","version":"0.1.0"}
pytest                                 # run the backend tests
```

> FFmpeg is required by the `cratedig` engine for downloads (not yet exercised in Phase 0). The app
> uses a **system FFmpeg if present** and falls back to a bundled copy in packaged builds
> ([`DESIGN.md`](DESIGN.md) §3.3).

### Frontend (React + Vite)

```powershell
npm install
npm run dev        # → http://localhost:1420  (shows "backend: connected" once the backend is up)
```

## License & disclaimer

Free software under the **GNU General Public License v3.0 or later** (inherited from `cratedig`),
© Prodromos Chrysostomou. The same legal disclaimer as `cratedig` applies and is shown in the app's
About screen — use it only for content you have the right to download. See
[`DESIGN.md`](DESIGN.md) §11.
