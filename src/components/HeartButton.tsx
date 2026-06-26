import { useToggleFavorite } from "../features/favorites/queries";

export function HeartButton({ trackId, isFavorite }: { trackId: number; isFavorite: boolean }) {
  const toggle = useToggleFavorite();
  return (
    <button
      type="button"
      className={isFavorite ? "toggle active" : "toggle"}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ trackId, favorite: !isFavorite });
      }}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}
