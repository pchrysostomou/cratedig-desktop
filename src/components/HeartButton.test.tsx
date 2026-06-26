import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils";
import { HeartButton } from "./HeartButton";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({ ok: true, status: 204, text: async () => "" }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("HeartButton", () => {
  it("favorites a track via PUT /favorites/{id}", async () => {
    renderWithProviders(<HeartButton trackId={5} isFavorite={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c) => ({
        url: String(c[0]),
        method: (c[1] as RequestInit | undefined)?.method,
      }));
      expect(calls.some((c) => c.url.includes("/favorites/5") && c.method === "PUT")).toBe(true);
    });
  });
});
