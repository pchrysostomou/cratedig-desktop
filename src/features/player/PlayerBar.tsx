import { coverUrl } from "../../api/client";
import { useTrack } from "../library/queries";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { usePlayerStore } from "./store";

function NowPlaying({ id }: { id: number }) {
  const { data } = useTrack(id);
  if (!data) return null;
  return (
    <div className="now-playing-inner">
      <img
        className="np-cover"
        src={coverUrl(id)}
        alt=""
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
      />
      <div className="np-meta">
        <div className="np-title">{data.title}</div>
        <div className="np-artist muted">{data.artists.join(", ")}</div>
      </div>
    </div>
  );
}

export function PlayerBar() {
  const currentTrackId = usePlayerStore((s) => s.currentTrackId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const hasTrack = currentTrackId != null;

  return (
    <footer className="player-bar">
      <div className="now-playing">
        {hasTrack ? <NowPlaying id={currentTrackId} /> : <span className="muted">Nothing playing</span>}
      </div>

      <div className="player-center">
        <div className="transport">
          <button type="button" onClick={prev} aria-label="Previous" disabled={!hasTrack}>
            ⏮
          </button>
          <button
            type="button"
            className="play-pause"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!hasTrack}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button type="button" onClick={next} aria-label="Next" disabled={!hasTrack}>
            ⏭
          </button>
        </div>
        <ProgressBar />
      </div>

      <div className="player-right">
        <VolumeControl />
      </div>
    </footer>
  );
}
