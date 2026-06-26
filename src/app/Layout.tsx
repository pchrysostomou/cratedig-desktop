import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { PlayerBar } from "../features/player/PlayerBar";

export function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  );
}
