import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteTrack, getLibrary, getTrack, type LibraryParams } from "../../api/client";
import { usePlayerStore } from "../player/store";

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

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteFile }: { id: number; deleteFile: boolean }) =>
      deleteTrack(id, deleteFile),
    onSuccess: (_data, { id }) => {
      // stop/advance the player if the deleted track was playing, then refresh views.
      usePlayerStore.getState().handleTrackDeleted(id);
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["playlists"] });
      qc.invalidateQueries({ queryKey: ["playlist"] });
    },
  });
}
