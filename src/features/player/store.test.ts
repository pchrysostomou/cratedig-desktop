import { beforeEach, describe, expect, it, vi } from "vitest";

// The store drives the imperative engine; mock it so we test pure state transitions.
vi.mock("../../audio/engine", () => ({
  audioEngine: {
    load: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    preloadNext: vi.fn(),
    el: { currentTime: 0, duration: 100 },
  },
}));
vi.mock("../../api/client", () => ({
  streamUrl: (id: number) => `/stream/${id}`,
  postHistory: vi.fn(() => Promise.resolve()),
}));

import { usePlayerStore } from "./store";

beforeEach(() => {
  usePlayerStore.setState({
    queue: [],
    currentIndex: -1,
    currentTrackId: null,
    isPlaying: false,
    volume: 1,
    muted: false,
    duration: 0,
    status: "idle",
  });
});

describe("player store", () => {
  it("playNow sets the queue and current track", () => {
    usePlayerStore.getState().playNow([10, 20, 30], 1);
    const s = usePlayerStore.getState();
    expect(s.currentTrackId).toBe(20);
    expect(s.currentIndex).toBe(1);
    expect(s.queue).toEqual([10, 20, 30]);
  });

  it("next advances through the queue", () => {
    usePlayerStore.getState().playNow([10, 20, 30], 0);
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentTrackId).toBe(20);
  });

  it("next at the end stops playback", () => {
    usePlayerStore.getState().playNow([10], 0);
    usePlayerStore.getState().next();
    const s = usePlayerStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.status).toBe("ended");
  });
});
