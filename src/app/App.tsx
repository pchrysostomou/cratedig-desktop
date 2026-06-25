import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/client";

// Proves the UI↔backend HTTP seam on day one (DESIGN.md §1): a live indicator that
// polls GET /health. Turns green when the FastAPI backend is reachable.
function BackendStatus() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <span className="status-dot">backend: connecting…</span>;
  }
  if (isError || !data) {
    return <span className="status-dot offline">backend: offline</span>;
  }
  return (
    <span className="status-dot connected">backend: connected (v{data.version})</span>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>cratedig</h1>
        <nav>
          <a href="#">Library</a>
          <a href="#">Search</a>
          <a href="#">Favorites</a>
        </nav>
      </aside>

      <main className="main">
        <h2>Library</h2>
        <p style={{ color: "var(--text-dim)" }}>
          Phase 0 scaffold — the library grid, player, and downloads arrive in later
          phases (see DESIGN.md §9).
        </p>
      </main>

      <footer className="player-bar">
        <BackendStatus />
      </footer>
    </div>
  );
}
