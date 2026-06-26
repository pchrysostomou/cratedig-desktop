import { useState } from "react";
import { useDeleteTrack } from "./queries";

// Confirm before removing a track (it can't happen by accident). Optionally also
// deletes the audio file from disk (default OFF). Delete styled destructive.
export function DeleteTrackDialog({
  trackId,
  title,
  open,
  onClose,
  onDeleted,
}: {
  trackId: number;
  title: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [deleteFile, setDeleteFile] = useState(false);
  const del = useDeleteTrack();

  if (!open) return null;

  const onConfirm = () => {
    del.mutate(
      { id: trackId, deleteFile },
      {
        onSuccess: () => {
          setDeleteFile(false);
          onClose();
          onDeleted?.();
        },
      },
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Delete track" onClick={(e) => e.stopPropagation()}>
        <h2>Delete track</h2>
        <p>
          Delete <strong>{title}</strong> from your library?
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={deleteFile}
            onChange={(e) => setDeleteFile(e.target.checked)}
          />
          Also delete the file from my computer
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
