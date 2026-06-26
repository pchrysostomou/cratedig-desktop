import { useQuery } from "@tanstack/react-query";
import { getLibrary, getTrack, type LibraryParams } from "../../api/client";

export function useTracks(params: LibraryParams) {
  return useQuery({
    queryKey: ["library", params],
    queryFn: () => getLibrary(params),
  });
}

export function useTrack(id: number) {
  return useQuery({
    queryKey: ["track", id],
    queryFn: () => getTrack(id),
    enabled: Number.isFinite(id),
  });
}
