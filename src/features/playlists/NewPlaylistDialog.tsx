import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePlaylist } from "./queries";

export function NewPlaylistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const create = useCreatePlaylist();
  const navigate = useNavigate();

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed },
      {
        onSuccess: (playlist) => {
          setName("");
          onClose();
          navigate(`/playlists/${playlist.id}`);
        },
      },
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="New playlist" onClick={(e) => e.stopPropagation()}>
        <h2>New playlist</h2>
        <form onSubmit={submit}>
          <input
            autoFocus
            type="text"
            className="download-input"
            placeholder="Playlist name"
            aria-label="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button type="submit" disabled={create.isPending || !name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
