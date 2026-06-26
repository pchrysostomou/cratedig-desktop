import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/client";

// Live indicator of the FastAPI backend (DESIGN.md §1). Lives in the sidebar footer.
export function BackendStatus() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 5000,
  });

  if (isLoading) return <span className="status-dot">backend: connecting…</span>;
  if (isError || !data) return <span className="status-dot offline">backend: offline</span>;
  return <span className="status-dot connected">backend: connected (v{data.version})</span>;
}
