import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Track } from "../../types";
import { renderWithProviders } from "../../test/utils";
import { LibraryView } from "./LibraryView";

// Virtuoso measures layout, which jsdom does not provide; render items plainly here.
vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent }: { data: Track[]; itemContent: (i: number, t: Track) => unknown }) => (
    <div>{data.map((item, i) => <div key={i}>{itemContent(i, item) as React.ReactNode}</div>)}</div>
  ),
}));

function makeTrack(over: Partial<Track>): Track {
  return {
    id: 1,
    source_id: "m",
    title: "Title",
    artists: ["Artist"],
    primary_artist: "Artist",
    album: "Album",
    isrc: null,
    duration_ms: 1000,
    track_number: 1,
    disc_number: 1,
    release_year: null,
    cover_art_url: null,
    file_format: "mp3",
    youtube_url: null,
    play_count: 0,
    added_at: 0,
    last_played_at: null,
    is_favorite: false,
    ...over,
  };
}

const TRACKS = [
  makeTrack({ id: 1, title: "Get Lucky", primary_artist: "Daft Punk", artists: ["Daft Punk"], duration_ms: 369000 }),
  makeTrack({ id: 2, title: "Instant Crush", primary_artist: "Daft Punk", artists: ["Daft Punk"], duration_ms: 0 }),
];

function fetchReturning(tracks: Track[]) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(tracks),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchReturning(TRACKS));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LibraryView", () => {
  it("renders rows from /library data", async () => {
    renderWithProviders(<LibraryView />);
    expect(await screen.findByText("Get Lucky")).toBeInTheDocument();
    expect(screen.getByText("Instant Crush")).toBeInTheDocument();
    // duration_ms 0 renders as the placeholder
    expect(screen.getByText("--:--")).toBeInTheDocument();
  });

  it("search input drives the /library query (q param)", async () => {
    const fetchMock = fetchReturning(TRACKS);
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LibraryView />);
    await screen.findByText("Get Lucky");

    await userEvent.type(screen.getByLabelText("Search library"), "lucky");

    await waitFor(
      () => {
        const urls = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(
          (c) => String(c[0]),
        );
        expect(urls.some((u) => u.includes("q=lucky"))).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
