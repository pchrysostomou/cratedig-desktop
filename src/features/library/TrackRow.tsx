import type { Track } from "../../types";
import { formatDuration } from "../../lib/format";
import { HeartButton } from "../../components/HeartButton";
import { TrackOverflowMenu } from "./TrackOverflowMenu";

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
      <span className="cell cell-actions">
        <HeartButton trackId={track.id} isFavorite={track.is_favorite} />
        <TrackOverflowMenu trackId={track.id} title={track.title} />
      </span>
    </div>
  );
}
