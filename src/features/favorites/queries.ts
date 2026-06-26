import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavorites, removeFavorite } from "../../api/client";

export function useFavorites() {
  return useQuery({ queryKey: ["favorites"], queryFn: getFavorites });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, favorite }: { trackId: number; favorite: boolean }) =>
      favorite ? addFavorite(trackId) : removeFavorite(trackId),
    onSuccess: (_data, { trackId }) => {
      // is_favorite is embedded in many responses — refresh the affected views.
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["track", trackId] });
      qc.invalidateQueries({ queryKey: ["playlist"] });
    },
  });
}
