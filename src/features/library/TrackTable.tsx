import { Virtuoso } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import type { Track } from "../../types";
import { TrackRow } from "./TrackRow";

export function TrackTable({ tracks }: { tracks: Track[] }) {
  const navigate = useNavigate();
  return (
    <div className="track-table">
      <div className="track-row track-head">
        <span className="cell">Title</span>
        <span className="cell">Artist</span>
        <span className="cell">Album</span>
        <span className="cell num">Duration</span>
      </div>
      <Virtuoso
        className="track-scroll"
        data={tracks}
        itemContent={(_, track) => (
          <TrackRow track={track} onOpen={() => navigate(`/tracks/${track.id}`)} />
        )}
      />
    </div>
  );
}
