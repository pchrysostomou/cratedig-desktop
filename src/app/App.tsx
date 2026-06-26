import { Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Placeholder } from "../components/Placeholder";
import { LibraryView } from "../features/library/LibraryView";
import { SearchView } from "../features/search/SearchView";
import { TrackDetailView } from "../features/library/TrackDetailView";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LibraryView />} />
        <Route path="search" element={<SearchView />} />
        <Route
          path="favorites"
          element={<Placeholder title="Favorites" note="Arriving in Phase 5." />}
        />
        <Route path="tracks/:id" element={<TrackDetailView />} />
      </Route>
    </Routes>
  );
}
