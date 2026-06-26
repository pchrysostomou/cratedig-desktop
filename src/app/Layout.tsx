import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAudioEngine } from "../audio/useAudioEngine";
import { Sidebar } from "../components/Sidebar";
import { DownloadDialog } from "../features/download/DownloadDialog";
import { usePlaybackPersistence } from "../features/playback/usePlaybackPersistence";
import { NewPlaylistDialog } from "../features/playlists/NewPlaylistDialog";
import { PlayerBar } from "../features/player/PlayerBar";

export function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  const [newPlaylistOpen, setNewPlaylistOpen] = useState(false);
  useAudioEngine(); // player engine, once at the stable root
  usePlaybackPersistence(); // hydrate + persist queue/player-state

  return (
    <div className="app-shell">
      <Sidebar onAdd={() => setAddOpen(true)} onNewPlaylist={() => setNewPlaylistOpen(true)} />
      <main className="main">
        <Outlet />
      </main>
      <PlayerBar />
      <DownloadDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <NewPlaylistDialog open={newPlaylistOpen} onClose={() => setNewPlaylistOpen(false)} />
    </div>
  );
}
