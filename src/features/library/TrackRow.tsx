import type { Track } from "../../types";
import { formatDuration } from "../../lib/format";

export function TrackRow({
  track,
  onOpen,
  onPlay,
}: {
  track: Track;
  onOpen: () => void;
  onPlay: () => void;
}) {
  return (
    <div
      className="track-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="cell cell-play">
        <button
          type="button"
          className="row-play"
          aria-label={`Play ${track.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          ▶
        </button>
      </span>
      <span className="cell cell-title">{track.title}</span>
      <span className="cell cell-artist">{track.artists.join(", ")}</span>
      <span className="cell cell-album">{track.album ?? "—"}</span>
      <span className="cell cell-duration num">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}
