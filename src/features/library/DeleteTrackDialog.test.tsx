import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils";
import { DeleteTrackDialog } from "./DeleteTrackDialog";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({ ok: true, status: 204, text: async () => "" }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function deleteCalls() {
  return fetchMock.mock.calls
    .map((c) => ({ url: String(c[0]), method: (c[1] as RequestInit | undefined)?.method }))
    .filter((c) => c.method === "DELETE");
}

describe("DeleteTrackDialog", () => {
  it("deletes without the file by default", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <DeleteTrackDialog trackId={5} title="Get Lucky" open onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteCalls().some((c) => c.url.includes("/tracks/5?delete_file=false"))).toBe(true);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("passes delete_file=true when the checkbox is ticked", async () => {
    renderWithProviders(<DeleteTrackDialog trackId={7} title="X" open onClose={() => {}} />);
    await userEvent.click(screen.getByLabelText(/also delete the file/i));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteCalls().some((c) => c.url.includes("/tracks/7?delete_file=true"))).toBe(true);
    });
  });
});
