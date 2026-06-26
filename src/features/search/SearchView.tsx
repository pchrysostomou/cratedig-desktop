import { LibraryView } from "../library/LibraryView";

// Search is just the library list focused on its search box, wired to /library?q=
// (DESIGN.md §7.1, §10 Q1). Not a stub — real search over the downloaded library.
export function SearchView() {
  return <LibraryView heading="Search" autoFocusSearch />;
}
