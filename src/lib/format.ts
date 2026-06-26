/** Format a duration in milliseconds as "m:ss"; "--:--" when unknown (duration_ms 0). */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "--:--";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
