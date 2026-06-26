import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Track } from "../../types";
import { formatDuration } from "../../lib/format";
import { HeartButton } from "../../components/HeartButton";

export function SortableTrackRow({
  track,
  onPlay,
  onRemove,
}: {
  track: Track;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="track-row pl-row">
      <span className="cell cell-handle">
        {/* drag listeners live on the handle only, so play/heart/remove clicks still work */}
        <button type="button" className="drag-handle" aria-label="Reorder track" {...attributes} {...listeners}>
          ⋮⋮
        </button>
      </span>
      <span className="cell cell-play">
        <button type="button" className="row-play" aria-label={`Play ${track.title}`} onClick={onPlay}>
          ▶
        </button>
      </span>
      <span className="cell cell-title">{track.title}</span>
      <span className="cell cell-artist">{track.artists.join(", ")}</span>
      <span className="cell cell-album">{track.album ?? "—"}</span>
      <span className="cell cell-duration num">{formatDuration(track.duration_ms)}</span>
      <span className="cell cell-actions">
        <HeartButton trackId={track.id} isFavorite={track.is_favorite} />
        <button type="button" className="row-remove" aria-label={`Remove ${track.title}`} onClick={onRemove}>
          ✕
        </button>
      </span>
    </div>
  );
}
