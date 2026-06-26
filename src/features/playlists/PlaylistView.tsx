import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Track } from "../../types";
import { usePlayerStore } from "../player/store";
import { SortableTrackRow } from "./SortableTrackRow";
import {
  useDeletePlaylist,
  usePlaylist,
  useRemoveTrackFromPlaylist,
  useReorderPlaylist,
} from "./queries";

export function PlaylistView() {
  const { id } = useParams();
  const playlistId = Number(id);
  const { data, isLoading, isError } = usePlaylist(playlistId);
  const reorder = useReorderPlaylist(playlistId);
  const removeTrack = useRemoveTrackFromPlaylist(playlistId);
  const deletePlaylist = useDeletePlaylist();
  const navigate = useNavigate();

  // While a drag is settling, render from local order so a refetch can't snap it back.
  const [temp, setTemp] = useState<Track[] | null>(null);
  const tracks = temp ?? data?.tracks ?? [];
  const ids = useMemo(() => tracks.map((t) => t.id), [tracks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (isLoading) return <p className="muted">Loading…</p>;
  if (isError || !data) return <p className="error">Couldn’t load this playlist.</p>;

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tracks.findIndex((t) => t.id === active.id);
    const newIndex = tracks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(tracks, oldIndex, newIndex);
    setTemp(next);
    try {
      await reorder.mutateAsync(next.map((t) => t.id));
    } finally {
      setTemp(null);
    }
  };

  const playAll = () => {
    if (ids.length) usePlayerStore.getState().playNow(ids, 0);
  };

  const onDelete = () => {
    if (confirm(`Delete playlist “${data.name}”?`)) {
      deletePlaylist.mutate(playlistId, { onSuccess: () => navigate("/") });
    }
  };

  return (
    <div className="library">
      <div className="playlist-header">
        <div>
          <h2>{data.name}</h2>
          {data.description && <p className="muted">{data.description}</p>}
          <p className="muted">{tracks.length} track(s)</p>
        </div>
        <div className="playlist-actions">
          <button type="button" className="add-button" onClick={playAll} disabled={!ids.length}>
            ▶ Play all
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="muted">This playlist is empty. Use the ⋯ menu on a track to add songs.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="track-table">
              <div className="track-row pl-row track-head">
                <span className="cell" />
                <span className="cell" />
                <span className="cell">Title</span>
                <span className="cell">Artist</span>
                <span className="cell">Album</span>
                <span className="cell num">Duration</span>
                <span className="cell" />
              </div>
              {tracks.map((track, index) => (
                <SortableTrackRow
                  key={track.id}
                  track={track}
                  onPlay={() => usePlayerStore.getState().playNow(ids, index)}
                  onRemove={() => removeTrack.mutate(track.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
