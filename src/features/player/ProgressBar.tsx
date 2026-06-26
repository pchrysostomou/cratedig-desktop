import { useEffect, useRef } from "react";
import { audioEngine } from "../../audio/engine";
import { formatTime } from "../../lib/format";
import { usePlayerStore } from "./store";

// The seek bar binds to the audio element via refs/DOM writes so timeupdate ticks
// (up to ~66Hz) never re-render React. Only `duration` (rare) comes from the store.
export function ProgressBar() {
  const duration = usePlayerStore((s) => s.duration);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  useEffect(() => {
    const el = audioEngine.el;
    const paint = () => {
      if (scrubbing.current) return;
      const total = el.duration || 0;
      const pct = total > 0 ? (el.currentTime / total) * 100 : 0;
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;
      if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
      if (timeRef.current) timeRef.current.textContent = formatTime(el.currentTime);
    };
    el.addEventListener("timeupdate", paint);
    el.addEventListener("loadedmetadata", paint);
    el.addEventListener("seeked", paint);
    paint();
    return () => {
      el.removeEventListener("timeupdate", paint);
      el.removeEventListener("loadedmetadata", paint);
      el.removeEventListener("seeked", paint);
    };
  }, []);

  const fractionFromClientX = (clientX: number): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const paintFraction = (fraction: number) => {
    if (fillRef.current) fillRef.current.style.width = `${fraction * 100}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${fraction * 100}%`;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    scrubbing.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    paintFraction(fractionFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing.current) return;
    paintFraction(fractionFromClientX(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    const fraction = fractionFromClientX(e.clientX);
    usePlayerStore.getState().seek(fraction * (audioEngine.el.duration || 0));
  };

  return (
    <div className="progress">
      <span className="time" ref={timeRef}>
        0:00
      </span>
      <div
        className="progress-bar"
        ref={barRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="progress-fill" ref={fillRef} />
        <div className="progress-thumb" ref={thumbRef} />
      </div>
      <span className="time total">{duration > 0 ? formatTime(duration) : "--:--"}</span>
    </div>
  );
}
