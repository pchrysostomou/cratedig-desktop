import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils";
import { DownloadDialog } from "./DownloadDialog";

function ok(body: unknown) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}

function fetchMock() {
  return vi.fn(async (url: string) => {
    const u = String(url);
    if (u.endsWith("/download")) {
      return ok({ job_id: "j1" });
    }
    if (u.includes("/jobs/j1")) {
      return ok({
        id: "j1",
        query: "q",
        status: "done",
        done: 1,
        total: 1,
        error: null,
        track_ids: [5],
        results_summary: { success: 1 },
        created_at: 0,
        finished_at: 1,
      });
    }
    return ok([]);
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DownloadDialog", () => {
  it("submits a query, polls the job, and shows completion", async () => {
    renderWithProviders(<DownloadDialog open onClose={() => {}} />);
    await userEvent.type(screen.getByLabelText("Download query"), "Daft Punk - Get Lucky");
    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => expect(screen.getByText(/added 1 track/i)).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText(/Status: done/i)).toBeInTheDocument();
  });
});
