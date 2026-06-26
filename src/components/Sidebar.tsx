import { NavLink } from "react-router-dom";
import { BackendStatus } from "./BackendStatus";

const LINKS = [
  { to: "/", label: "Library", end: true },
  { to: "/search", label: "Search", end: false },
  { to: "/favorites", label: "Favorites", end: false },
];

export function Sidebar({ onAdd }: { onAdd: () => void }) {
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
      <div className="sidebar-footer">
        <BackendStatus />
      </div>
    </aside>
  );
}
