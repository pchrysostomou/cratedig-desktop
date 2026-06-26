import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../../api/client";

// Proves the UI↔backend HTTP seam (DESIGN.md §1): polls GET /health and turns
// green when the FastAPI backend is reachable. The real transport controls arrive
// in Phase 4 (DESIGN.md §7.3).
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
  return <span className="status-dot connected">backend: connected (v{data.version})</span>;
}

export function PlayerBar() {
  return (
    <footer className="player-bar">
      <span className="player-placeholder muted">Player arrives in Phase 4</span>
      <BackendStatus />
    </footer>
  );
}
