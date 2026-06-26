import { useState } from "react";
import { useDownloadJob } from "./useDownloadJob";

export function DownloadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { submit, job, isStarting } = useDownloadJob();

  if (!open) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) submit({ query: trimmed });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="Add music"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Add music</h2>
        <form onSubmit={onSubmit}>
          <input
            autoFocus
            type="text"
            className="download-input"
            placeholder="Paste a MusicBrainz link or search Artist - Title"
            aria-label="Download query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button type="submit" disabled={isStarting || !query.trim()}>
              {isStarting ? "Starting…" : "Download"}
            </button>
          </div>
        </form>

        {job && (
          <div className="job-status">
            <span>Status: {job.status}</span>
            {job.total > 0 && (
              <span>
                {" "}
                · {job.done}/{job.total}
              </span>
            )}
            {job.status === "error" && <span className="error"> · {job.error}</span>}
            {job.status === "done" && (
              <span className="ok"> · added {job.track_ids.length} track(s)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
