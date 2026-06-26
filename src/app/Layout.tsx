import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAudioEngine } from "../audio/useAudioEngine";
import { Sidebar } from "../components/Sidebar";
import { DownloadDialog } from "../features/download/DownloadDialog";
import { PlayerBar } from "../features/player/PlayerBar";

export function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  useAudioEngine(); // mount the player engine once, at the stable root

  return (
    <div className="app-shell">
      <Sidebar onAdd={() => setAddOpen(true)} />
      <main className="main">
        <Outlet />
      </main>
      <PlayerBar />
      <DownloadDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
