import { Virtuoso } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import type { Track } from "../../types";
import { usePlayerStore } from "../player/store";
import { TrackRow } from "./TrackRow";

export function TrackTable({ tracks }: { tracks: Track[] }) {
  const navigate = useNavigate();
  const ids = tracks.map((t) => t.id);

  return (
    <div className="track-table">
      <div className="track-row track-head">
        <span className="cell" />
        <span className="cell">Title</span>
        <span className="cell">Artist</span>
        <span className="cell">Album</span>
        <span className="cell num">Duration</span>
        <span className="cell" />
      </div>
      <Virtuoso
        className="track-scroll"
        data={tracks}
        itemContent={(index, track) => (
          <TrackRow
            track={track}
            onOpen={() => navigate(`/tracks/${track.id}`)}
            onPlay={() => usePlayerStore.getState().playNow(ids, index)}
          />
        )}
      />
    </div>
  );
}
