import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/client";
import { Splash } from "./Splash";

// Gate the app behind a /health probe so we don't render the UI before the
// Tauri-spawned backend sidecar is listening (DESIGN §8.3). Retries until ready.
export function BackendGate({ children }: { children: ReactNode }) {
  const { isSuccess } = useQuery({
    queryKey: ["health-gate"],
    queryFn: getHealth,
    retry: true,
    retryDelay: 300,
  });
  return isSuccess ? <>{children}</> : <Splash />;
}
