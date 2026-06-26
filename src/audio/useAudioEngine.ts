import { useEffect } from "react";
import { usePlayerStore } from "../features/player/store";
import { audioEngine } from "./engine";

// Mount EXACTLY ONCE at the stable root (Layout) — not inside a routed view, or
// react-router would unmount it and kill playback. Syncs element events -> store.
export function useAudioEngine(): void {
  useEffect(() => {
    const detach = audioEngine.attach({
      onEnded: () => usePlayerStore.getState()._onEnded(),
      onLoadedMetadata: (duration) => usePlayerStore.getState()._setDuration(duration),
      onPlay: () => usePlayerStore.getState()._setPlaying(true),
      onPause: () => usePlayerStore.getState()._setPlaying(false),
      onError: () => usePlayerStore.getState()._setStatus("error"),
    });
    return detach;
  }, []);
}
