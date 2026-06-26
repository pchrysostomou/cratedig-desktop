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

import { audioEngine } from "../../audio/engine";
import { usePlayerStore } from "./store";

beforeEach(() => {
  vi.clearAllMocks();
  usePlayerStore.setState({
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

  it("next at the end stops playback when repeat is off", () => {
    usePlayerStore.getState().playNow([10], 0);
    usePlayerStore.getState().next();
    const s = usePlayerStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.status).toBe("ended");
  });

  it("next wraps to the start when repeat is 'all'", () => {
    usePlayerStore.getState().playNow([10, 20], 0);
    usePlayerStore.setState({ repeat: "all" });
    usePlayerStore.getState().next(); // -> 20
    usePlayerStore.getState().next(); // past end -> wrap to 10
    expect(usePlayerStore.getState().currentTrackId).toBe(10);
  });

  it("_onEnded replays the same track when repeat is 'one'", () => {
    usePlayerStore.getState().playNow([10, 20], 0);
    usePlayerStore.setState({ repeat: "one" });
    usePlayerStore.getState()._onEnded();
    expect(usePlayerStore.getState().currentTrackId).toBe(10); // unchanged
    expect(audioEngine.seek).toHaveBeenCalledWith(0);
    expect(audioEngine.play).toHaveBeenCalled();
  });

  it("cycleRepeat goes off -> all -> one -> off", () => {
    const { cycleRepeat } = usePlayerStore.getState();
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("all");
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("one");
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("off");
  });

  it("toggleShuffle pins the current track and restores original order", () => {
    usePlayerStore.getState().playNow([10, 20, 30], 0);
    usePlayerStore.getState().toggleShuffle();
    let s = usePlayerStore.getState();
    expect(s.shuffle).toBe(true);
    expect(s.queue[0]).toBe(10); // current track pinned at the front
    expect(s.queue).toHaveLength(3);
    expect(s.originalOrder).toEqual([10, 20, 30]);

    usePlayerStore.getState().toggleShuffle();
    s = usePlayerStore.getState();
    expect(s.shuffle).toBe(false);
    expect(s.queue).toEqual([10, 20, 30]); // restored
  });
});
