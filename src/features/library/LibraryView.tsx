import { useState } from "react";
import type { SortField, SortOrder } from "../../api/client";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { TrackTable } from "./TrackTable";
import { useTracks } from "./queries";

const SORTS: { value: SortField; label: string }[] = [
  { value: "added_at", label: "Date added" },
  { value: "title", label: "Title" },
  { value: "primary_artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "duration_ms", label: "Duration" },
];

export function LibraryView({
  heading = "Library",
  autoFocusSearch = false,
}: {
  heading?: string;
  autoFocusSearch?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("added_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const q = useDebouncedValue(search, 250);
  const { data, isLoading, isError } = useTracks({ q: q || undefined, sort, order });

  return (
    <div className="library">
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search your library…"
          aria-label="Search library"
          value={search}
          autoFocus={autoFocusSearch}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="sort-control">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortField)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="order-toggle"
          aria-label={order === "asc" ? "Ascending" : "Descending"}
          onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
        >
          {order === "asc" ? "↑" : "↓"}
        </button>
      </div>

      <h2 className="sr-only">{heading}</h2>

      {isLoading && <p className="muted">Loading…</p>}
      {isError && <p className="error">Couldn’t reach the backend.</p>}
      {data && data.length === 0 && (
        <p className="muted">No tracks yet. Download something to get started.</p>
      )}
      {data && data.length > 0 && <TrackTable tracks={data} />}
    </div>
  );
}
