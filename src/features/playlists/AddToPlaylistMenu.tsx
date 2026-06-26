import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAddTrackToPlaylist, usePlaylists } from "./queries";

const MENU_WIDTH = 200;

// "⋯" overflow menu (Add to playlist). The menu is portaled to document.body with
// fixed coordinates from the trigger's rect, so it escapes the virtualized library
// scroller and never clips at the bottom edge. Closes on Escape (focus returns to
// the trigger), outside-click, and scroll/resize.
export function AddToPlaylistMenu({ trackId }: { trackId: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: playlists } = usePlaylists();
  const addTrack = useAddTrackToPlaylist();

  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAndFocus();
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true); // capture: any scroller
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="overflow-menu"
            role="menu"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-heading">Add to playlist</div>
            {playlists && playlists.length > 0 ? (
              playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  className="overflow-item"
                  onClick={() => {
                    addTrack.mutate({ playlistId: p.id, trackId });
                    setOpen(false);
                  }}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <div className="overflow-empty">No playlists yet</div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <span className="overflow">
      <button
        ref={triggerRef}
        type="button"
        className="overflow-btn"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openMenu();
        }}
      >
        ⋯
      </button>
      {menu}
    </span>
  );
}
