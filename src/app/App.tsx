import { Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { FavoritesView } from "../features/favorites/FavoritesView";
import { LibraryView } from "../features/library/LibraryView";
import { PlaylistView } from "../features/playlists/PlaylistView";
import { SearchView } from "../features/search/SearchView";
import { TrackDetailView } from "../features/library/TrackDetailView";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LibraryView />} />
        <Route path="search" element={<SearchView />} />
        <Route path="favorites" element={<FavoritesView />} />
        <Route path="playlists/:id" element={<PlaylistView />} />
        <Route path="tracks/:id" element={<TrackDetailView />} />
      </Route>
    </Routes>
  );
}
