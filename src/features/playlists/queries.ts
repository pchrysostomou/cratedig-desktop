import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylists,
  removeTrackFromPlaylist,
  renamePlaylist,
  reorderPlaylist,
} from "../../api/client";

export function usePlaylists() {
  return useQuery({ queryKey: ["playlists"], queryFn: getPlaylists });
}

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: ["playlist", id],
    queryFn: () => getPlaylist(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createPlaylist(name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlists"] }),
  });
}

export function useRenamePlaylist(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renamePlaylist(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      qc.invalidateQueries({ queryKey: ["playlist", id] });
    },
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePlaylist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlists"] }),
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: number; trackId: number }) =>
      addTrackToPlaylist(playlistId, trackId),
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      qc.invalidateQueries({ queryKey: ["playlist", playlistId] });
    },
  });
}

export function useRemoveTrackFromPlaylist(playlistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackId: number) => removeTrackFromPlaylist(playlistId, trackId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      qc.invalidateQueries({ queryKey: ["playlist", playlistId] });
    },
  });
}

export function useReorderPlaylist(playlistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedTrackIds: number[]) => reorderPlaylist(playlistId, orderedTrackIds),
    onSettled: () => qc.invalidateQueries({ queryKey: ["playlist", playlistId] }),
  });
}
