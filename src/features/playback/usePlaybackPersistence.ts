import { useEffect, useRef } from "react";
import { getPlayerState, getQueue, putPlayerState, putQueue } from "../../api/client";
import { audioEngine } from "../../audio/engine";
import { usePlayerStore } from "../player/store";

// Persist the queue + player state to the backend DB so playback resumes after a
// restart (DESIGN §9 Phase 5). Mount once at the stable root (Layout).
// - On launch: hydrate the store + cue the current track PAUSED at its saved position.
// - On change: debounced PUT /queue + /player-state.
// - Periodically: persist position_ms (read off the audio element).
export function usePlaybackPersistence(): void {
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [queue, state] = await Promise.all([getQueue(), getPlayerState()]);
        if (cancelled) return;
        const ids = queue.items.map((t) => t.id);
        usePlayerStore.getState().hydrate({
          queue: ids,
          currentIndex: state.current_index,
          shuffle: state.shuffle,
          repeat: state.repeat_mode,
          volume: state.volume / 100,
          currentTrackId: ids[state.current_index] ?? null,
          positionMs: state.position_ms,
        });
      } finally {
        hydrated.current = true;
      }
    })();

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = usePlayerStore.subscribe((s) => {
      if (!hydrated.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        putQueue(s.queue, s.currentIndex).catch(() => {});
        putPlayerState({
          current_index: s.currentIndex,
          shuffle: s.shuffle,
          repeat_mode: s.repeat,
          volume: Math.round(s.volume * 100),
        }).catch(() => {});
      }, 800);
    });

    const positionTimer = setInterval(() => {
      if (!hydrated.current) return;
      const s = usePlayerStore.getState();
      if (s.currentTrackId != null) {
        putPlayerState({ position_ms: Math.round(audioEngine.el.currentTime * 1000) }).catch(
          () => {},
        );
      }
    }, 5000);

    return () => {
      cancelled = true;
      unsubscribe();
      if (timer) clearTimeout(timer);
      clearInterval(positionTimer);
    };
  }, []);
}
