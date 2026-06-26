import { create } from "zustand";
import { postHistory, streamUrl } from "../../api/client";
import { audioEngine } from "../../audio/engine";
import type { RepeatMode } from "../../types";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export interface HydratePayload {
  queue: number[];
  currentIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number; // 0..1
  currentTrackId: number | null;
  positionMs: number;
}

export interface PlayerStore {
  // queue
  queue: number[];
  currentIndex: number;
  originalOrder: number[]; // pre-shuffle order, to restore when shuffle turns off
  shuffle: boolean;
  repeat: RepeatMode;
  // player
  currentTrackId: number | null;
  isPlaying: boolean;
  volume: number; // 0..1
  muted: boolean;
  duration: number; // seconds
  status: PlayerStatus;
  // intent actions
  playNow: (ids: number[], index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  handleTrackDeleted: (id: number) => void;
  hydrate: (payload: HydratePayload) => void;
  // engine-fact setters
  _setPlaying: (playing: boolean) => void;
  _setDuration: (duration: number) => void;
  _setStatus: (status: PlayerStatus) => void;
  _onEnded: () => void;
}

const REPEAT_CYCLE: RepeatMode[] = ["off", "all", "one"];

// currentTime is deliberately NOT in the store (would re-render every tick). The
// ProgressBar reads it straight off audioEngine.el (DESIGN §7.3).
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  queue: [],
  currentIndex: -1,
  originalOrder: [],
  shuffle: false,
  repeat: "off",
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
  },

  next: () => {
    const { queue, currentIndex, repeat } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all" && queue.length > 0) {
        get().playNow(queue, 0);
        return;
      }
      audioEngine.pause();
      set({ isPlaying: false, status: "ended" });
      return;
    }
    get().playNow(queue, nextIndex);
  },

  prev: () => {
    const { queue, currentIndex } = get();
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

  toggleShuffle: () => {
    const { shuffle, queue, currentIndex, currentTrackId, originalOrder } = get();
    if (!shuffle) {
      const original = [...queue];
      const rest = queue.filter((_, i) => i !== currentIndex);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const shuffled = currentTrackId != null ? [currentTrackId, ...rest] : rest;
      set({
        shuffle: true,
        originalOrder: original,
        queue: shuffled,
        currentIndex: currentTrackId != null ? 0 : currentIndex,
      });
    } else {
      const restored = originalOrder.length ? originalOrder : queue;
      const idx = currentTrackId != null ? restored.indexOf(currentTrackId) : currentIndex;
      set({ shuffle: false, queue: restored, currentIndex: idx >= 0 ? idx : 0, originalOrder: [] });
    }
  },

  cycleRepeat: () => {
    const current = get().repeat;
    const next = REPEAT_CYCLE[(REPEAT_CYCLE.indexOf(current) + 1) % REPEAT_CYCLE.length];
    set({ repeat: next });
  },

  handleTrackDeleted: (id) => {
    const s = get();
    const newQueue = s.queue.filter((trackId) => trackId !== id);
    if (s.currentTrackId === id) {
      // the playing track was deleted — stop (its file may be gone).
      audioEngine.pause();
      set({
        queue: newQueue,
        currentTrackId: null,
        currentIndex: -1,
        isPlaying: false,
        status: "idle",
        duration: 0,
      });
    } else if (s.currentTrackId != null) {
      set({ queue: newQueue, currentIndex: newQueue.indexOf(s.currentTrackId) });
    } else {
      set({ queue: newQueue });
    }
  },

  hydrate: ({ queue, currentIndex, shuffle, repeat, volume, currentTrackId, positionMs }) => {
    audioEngine.setVolume(volume);
    set({
      queue,
      currentIndex,
      shuffle,
      repeat,
      volume,
      currentTrackId,
      status: currentTrackId != null ? "paused" : "idle",
      isPlaying: false,
    });
    if (currentTrackId != null) {
      audioEngine.load(streamUrl(currentTrackId), false); // cued, PAUSED (autoplay policy)
      if (positionMs > 0) audioEngine.seek(positionMs / 1000); // applied on loadedmetadata
    }
  },

  _setPlaying: (playing) =>
    set((s) => ({
      isPlaying: playing,
      status: playing ? "playing" : s.status === "ended" ? "ended" : "paused",
    })),
  _setDuration: (duration) => set({ duration }),
  _setStatus: (status) => set({ status }),
  _onEnded: () => {
    if (get().repeat === "one") {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }
    get().next();
  },
}));
