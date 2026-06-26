import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Library", end: true },
  { to: "/search", label: "Search", end: false },
  { to: "/favorites", label: "Favorites", end: false },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h1>cratedig</h1>
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
    </aside>
  );
}
