import { QueryClient } from "@tanstack/react-query";

// Server-state cache for the FastAPI backend (DESIGN.md §7.2). The backend is on
// localhost, so refetching is cheap; keep retries low so a down backend surfaces
// quickly rather than hanging the UI.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
