import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAddTrackToPlaylist, usePlaylists } from "../playlists/queries";
import { DeleteTrackDialog } from "./DeleteTrackDialog";

const MENU_WIDTH = 200;

// The per-row "⋯" overflow menu: add-to-playlist + delete-from-library. The menu is
// portaled to <body> with fixed coordinates so it escapes the virtualized scroller
// and never clips. Closes on Escape (focus returns to trigger), outside-click, scroll.
export function TrackOverflowMenu({
  trackId,
  title,
  onDeleted,
}: {
  trackId: number;
  title: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    if (rect) setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
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
    window.addEventListener("scroll", onScrollOrResize, true);
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
            <div className="overflow-divider" />
            <button
              type="button"
              role="menuitem"
              className="overflow-item danger-item"
              onClick={() => {
                setOpen(false);
                setDeleteOpen(true);
              }}
            >
              Delete from library
            </button>
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
      <DeleteTrackDialog
        trackId={trackId}
        title={title}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
      />
    </span>
  );
}
