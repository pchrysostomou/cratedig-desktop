import { usePlayerStore } from "./store";

export function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  return (
    <div className="volume">
      <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
        {muted || volume === 0 ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        aria-label="Volume"
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
