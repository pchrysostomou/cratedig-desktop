import { TrackTable } from "../library/TrackTable";
import { useFavorites } from "./queries";

export function FavoritesView() {
  const { data, isLoading, isError } = useFavorites();

  return (
    <div className="library">
      <h2>Favorites</h2>
      {isLoading && <p className="muted">Loading…</p>}
      {isError && <p className="error">Couldn’t reach the backend.</p>}
      {data && data.length === 0 && (
        <p className="muted">No favorites yet. Tap the heart on a track to add it here.</p>
      )}
      {data && data.length > 0 && <TrackTable tracks={data} />}
    </div>
  );
}
