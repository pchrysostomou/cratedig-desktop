# cratedig-desktop — Claude Code Working Agreement

`cratedig-desktop` is a cross-platform (Windows-first) desktop music app: paste a MusicBrainz link
or a search query, it downloads the track via the **cratedig** engine, then manages and plays it
like Spotify (library, playlists, favorites, queue, in-app player). Stack: **Tauri** (Rust shell) +
**React/TypeScript** (UI) + **FastAPI** (local backend) + **SQLite** (state), wrapping the existing
**cratedig** Python library — UNCHANGED.

**`DESIGN.md` is the single source of truth for architecture and the phased build plan.
Read it before any work. This file is only the working agreement + conventions.**

## Workflow — ALWAYS follow
1. For every task, FIRST present a short plan (files you'll touch + approach) and WAIT for
   my explicit approval. Do NOT write code before I approve.
2. After approval, implement ONLY the current phase/feature. Do not jump ahead.
3. Live-test it (run the app/endpoints + tests) and verify it works before calling it done.
4. Only once it works — and I have reviewed — do you commit. One phase = one focused PR.
5. Phases are defined in `DESIGN.md` §9. Build them in order.

## Git & commits
- Branch per phase: `feature/<short-name>`. NEVER commit directly to `main`. I open/merge PRs and
  do ALL pushes/releases myself.
- Commits authored as **Prodromos Chrysostomou**. NO AI attribution or co-author trailers.
- Conventional Commits: `feat:`, `fix:`, `test:`, `chore:`, `docs:`. Scoped, meaningful.

## Stack & layout
- `src/` — React + TS frontend (Vite). `backend/` — FastAPI + SQLite. `src-tauri/` — Tauri shell
  (added in Phase 6).
- Module map + API + schema: `DESIGN.md` §4, §5, §6.

## Non-negotiable rules
- **cratedig stays UNCHANGED** — depend on it (git/PyPI), never modify or copy its internals.
- The UI NEVER downloads, touches files, or opens the database — it only calls the backend over HTTP.
- The backend is the single owner of `cratedig` + SQLite + the audio files.
- FFmpeg is **system-first, bundled-fallback** (`DESIGN.md` §3.3); never a hard pip dependency.
- Commit only after the feature runs, tests pass, and I have reviewed.
