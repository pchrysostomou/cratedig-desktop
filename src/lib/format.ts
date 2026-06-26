/** Format a duration in milliseconds as "m:ss"; "--:--" when unknown (duration_ms 0). */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "--:--";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Format a playhead time in seconds as "m:ss" ("0:00" at zero, unlike formatDuration). */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(s / 60);
  return `${minutes}:${String(s % 60).padStart(2, "0")}`;
}
