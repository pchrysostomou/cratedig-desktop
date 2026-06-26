import { NavLink } from "react-router-dom";
import { usePlaylists } from "../features/playlists/queries";
import { BackendStatus } from "./BackendStatus";

const LINKS = [
  { to: "/", label: "Library", end: true },
  { to: "/search", label: "Search", end: false },
  { to: "/favorites", label: "Favorites", end: false },
];

export function Sidebar({ onAdd, onNewPlaylist }: { onAdd: () => void; onNewPlaylist: () => void }) {
  const { data: playlists } = usePlaylists();

  return (
    <aside className="sidebar">
      <h1>cratedig</h1>
      <button type="button" className="add-button" onClick={onAdd}>
        + Add music
      </button>
      <nav>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="playlists-section">
        <div className="playlists-head">
          <span>Playlists</span>
          <button
            type="button"
            className="new-playlist-btn"
            aria-label="New playlist"
            onClick={onNewPlaylist}
          >
            +
          </button>
        </div>
        <nav className="playlist-links">
          {playlists?.map((p) => (
            <NavLink
              key={p.id}
              to={`/playlists/${p.id}`}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {p.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <BackendStatus />
      </div>
    </aside>
  );
}
