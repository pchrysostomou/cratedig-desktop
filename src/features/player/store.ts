import { create } from "zustand";
import { postHistory, streamUrl } from "../../api/client";
import { audioEngine } from "../../audio/engine";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export interface PlayerStore {
  // queue (in-memory this phase; DB-persisted queue + shuffle/repeat are Phase 5)
  queue: number[];
  currentIndex: number;
  // player
  currentTrackId: number | null;
  isPlaying: boolean;
  volume: number; // 0..1
  muted: boolean;
  duration: number; // seconds (from loadedmetadata)
  status: PlayerStatus;
  // intent actions (UI calls these; they drive the engine + state)
  playNow: (ids: number[], index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  // engine-fact setters (useAudioEngine calls these from element events)
  _setPlaying: (playing: boolean) => void;
  _setDuration: (duration: number) => void;
  _setStatus: (status: PlayerStatus) => void;
  _onEnded: () => void;
}

// NOTE: currentTime is deliberately NOT in the store — it would re-render on every
// timeupdate tick. The ProgressBar reads it straight off audioEngine.el (DESIGN §7.3).
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  queue: [],
  currentIndex: -1,
  currentTrackId: null,
  isPlaying: false,
  volume: 1,
  muted: false,
  duration: 0,
  status: "idle",

  playNow: (ids, index) => {
    const id = ids[index];
    if (id == null) return;
    set({ queue: ids, currentIndex: index, currentTrackId: id, status: "loading", duration: 0 });
    audioEngine.load(streamUrl(id), true);
    const nextId = ids[index + 1] ?? null;
    audioEngine.preloadNext(nextId != null ? streamUrl(nextId) : null);
    postHistory(id).catch(() => {});
  },

  togglePlay: () => {
    const { isPlaying, currentTrackId } = get();
    if (currentTrackId == null) return;
    if (isPlaying) audioEngine.pause();
    else audioEngine.play();
    // isPlaying is synced by the element's play/pause events via _setPlaying.
  },

  next: () => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      audioEngine.pause();
      set({ isPlaying: false, status: "ended" });
      return;
    }
    get().playNow(queue, nextIndex);
  },

  prev: () => {
    const { queue, currentIndex } = get();
    // Spotify behavior: restart if >3s in (or at the first track); else go back.
    if (audioEngine.el.currentTime > 3 || currentIndex <= 0) {
      audioEngine.seek(0);
      return;
    }
    get().playNow(queue, currentIndex - 1);
  },

  seek: (seconds) => audioEngine.seek(seconds),

  setVolume: (v) => {
    audioEngine.setVolume(v);
    if (v > 0) {
      audioEngine.setMuted(false);
      set({ volume: v, muted: false });
    } else {
      set({ volume: v });
    }
  },

  toggleMute: () => {
    const muted = !get().muted;
    audioEngine.setMuted(muted);
    set({ muted });
  },

  _setPlaying: (playing) =>
    set((s) => ({
      isPlaying: playing,
      status: playing ? "playing" : s.status === "ended" ? "ended" : "paused",
    })),
  _setDuration: (duration) => set({ duration }),
  _setStatus: (status) => set({ status }),
  _onEnded: () => get().next(),
}));
