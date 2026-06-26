import { Link, useParams } from "react-router-dom";
import { formatDuration } from "../../lib/format";
import { useTrack } from "./queries";

export function TrackDetailView() {
  const { id } = useParams();
  const trackId = Number(id);
  const { data, isLoading, isError, error } = useTrack(trackId);

  if (isLoading) return <p className="muted">Loading…</p>;
  if (isError) {
    const notFound = error instanceof Error && error.message.includes("404");
    return <p className="error">{notFound ? "Track not found." : "Couldn’t load this track."}</p>;
  }
  if (!data) return null;

  return (
    <article className="track-detail">
      <Link to="/" className="back-link">
        ← Library
      </Link>
      <h2>{data.title}</h2>
      <p className="detail-sub">
        {data.artists.join(", ")} · {data.album ?? "—"} · {formatDuration(data.duration_ms)}
        {data.release_year ? ` · ${data.release_year}` : ""}
      </p>
      {data.lyrics ? (
        <pre className="lyrics">{data.lyrics}</pre>
      ) : (
        <p className="muted">No lyrics.</p>
      )}
    </article>
  );
}
